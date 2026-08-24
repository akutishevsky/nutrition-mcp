// Behaviour tests for the shared macro-panel partial and for the import
// widget's alcohol gate.
//
// Widget code is inline template JS, so it has no import surface: `macros.js` is
// evaluated here the way the assembler splices it into a page — with the fmt/esc
// helpers each template supplies — and the caption strings are asserted against
// real values. Without this the wording is pinned by nothing at all.
import { test, expect } from "bun:test";
import { WIDGET_STRINGS_EN } from "../../src/copy/widgets";

const SRC = "./public/widgets/src";

// The same fmt/esc every template defines before including macros.js.
function fmt(n: number, decimals?: number) {
    if (n == null || isNaN(n)) return "0";
    const r = decimals ? n.toFixed(decimals) : Math.round(n);
    return Number(r).toLocaleString();
}
const esc = (s: unknown) => String(s);

type Bits = { goalLine: string; over: boolean; pct: number | null };
type Macro = { key: string; direction?: string };
type Vals = Record<string, number | null>;
const macrosApi = await (async () => {
    // shared/i18n.js before shared/macros.js, exactly as every template
    // orders its includes — macros.js reads T/tpl/plural from it. Only the
    // "en" dictionary is wired in (WIDGET_STRINGS = { en: ... }): these
    // tests assert English wording, and macroLabel()/T.macros.* fall back to
    // English by construction whenever a locale is missing.
    const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
    const macrosSrc = await Bun.file(`${SRC}/shared/macros.js`).text();
    // `document`/`window` are left undefined so the partial's delegated event
    // wiring (guarded by `typeof document`) stays out of the way.
    const factory = new Function(
        "fmt",
        "esc",
        "WIDGET_STRINGS",
        `${i18nSrc}\n${macrosSrc}\nreturn { macroBits, MACROS, macroPanel, macroLimit, macroCtxOf, dayHasData, mealList };`,
    );
    return factory(fmt, esc, { en: WIDGET_STRINGS_EN }) as {
        macroBits: (
            m: Macro,
            vals: Record<string, number>,
            goal: Record<string, number> | null,
            wording?: { under?: string; over?: string },
        ) => Bits;
        MACROS: Macro[];
        macroPanel: (
            vals: Vals,
            goal?: Vals | null,
            wording?: { under?: string; over?: string },
            meals?: unknown[],
            opts?: { drinkUnit?: string },
        ) => string;
        macroLimit: (m: Macro, ctx: unknown, interactive?: boolean) => string;
        macroCtxOf: (
            vals: Vals,
            goal?: Vals | null,
            wording?: unknown,
            meals?: unknown[],
            opts?: { drinkUnit?: string },
        ) => unknown;
        dayHasData: (day: Vals) => boolean;
        mealList: (m: Macro, meals: unknown[]) => string;
    };
})();

const macroOf = (key: string) => {
    const m = macrosApi.MACROS.find((x) => x.key === key);
    if (!m) throw new Error(`no MACROS entry for ${key}`);
    return m;
};
const line = (
    key: string,
    val: number,
    target: number | null,
    wording?: { under?: string; over?: string },
) =>
    macrosApi.macroBits(
        macroOf(key),
        { [key]: val },
        target === null ? null : { [key]: target },
        wording,
    ).goalLine;

// A ceiling is a limit to stay under, never a budget with something "left" in
// it — the wording a user trying to drink less reads as permission, and which
// says nothing at all averaged over a week.
test("a ceiling under its limit reads as being under it, not as budget left", () => {
    expect(line("alcohol_g", 0, 20)).toBe("limit 20 g · 20 g under");
    expect(line("sugar_g", 31.9, 45)).toBe("limit 45 g · 13.1 g under");
    expect(line("alcohol_g", 0, 20)).not.toContain("left");
});

test("a ceiling exceeded reads as over, and is flagged", () => {
    expect(line("sugar_g", 58.1, 45)).toBe("limit 45 g · 13.1 g over");
    expect(
        macrosApi.macroBits(
            macroOf("sugar_g"),
            { sugar_g: 58.1 },
            { sugar_g: 45 },
        ).over,
    ).toBe(true);
});

test("exactly at a ceiling is its own state, not '0 g under'", () => {
    expect(line("alcohol_g", 20, 20)).toBe("limit 20 g · at limit");
});

// The most likely alcohol limit there is. A floor of 0 stays meaningless.
test("a ceiling target of 0 is a real limit", () => {
    expect(line("alcohol_g", 0, 0)).toBe("limit 0 g · at limit");
    expect(line("alcohol_g", 5.2, 0)).toBe("limit 0 g · 5.2 g over");
    const b = macrosApi.macroBits(
        macroOf("alcohol_g"),
        { alcohol_g: 5.2 },
        { alcohol_g: 0 },
    );
    expect(b.over).toBe(true);
    // Percent of zero must not reach the caption as Infinity/NaN.
    expect(Number.isFinite(b.pct)).toBe(true);
});

test("a floor target of 0 is still no goal", () => {
    expect(line("protein_g", 40, 0)).toBe("no goal set");
    expect(line("protein_g", 40, null)).toBe("no goal set");
});

// Floors keep the wording they always had, including the caller override that
// trends uses for its averages.
test("floors are unchanged, and only floors take the wording override", () => {
    expect(line("protein_g", 145, 160)).toBe("of 160 g · 15 g left");
    expect(line("protein_g", 175, 160)).toBe("of 160 g · 15 g over");
    expect(line("protein_g", 145, 160, { under: "under" })).toBe(
        "of 160 g · 15 g under",
    );
    // A ceiling ignores it: "left" must not be reachable through the override.
    expect(line("sugar_g", 31.9, 45, { under: "left" })).toBe(
        "limit 45 g · 13.1 g under",
    );
});

// ---- interactive tiles: the accessible name -------------------------------
//
// `role="button"` makes a tile's children presentational, so the ring's own
// aria-label, the macro name and the goal caption all vanish from the
// accessibility tree. A tile that discloses something must therefore carry its
// value and goal state in its OWN name, or a screen-reader user hears the
// action and no numbers at all — while the static tile next to it reads them
// out in full. Verified against a real a11y-tree snapshot; pinned here.
const VALS = {
    calories: 2035,
    protein_g: 148,
    carbs_g: 205,
    fat_g: 74,
    fiber_g: 26.4,
    sugar_g: 58.2,
    alcohol_g: 12.5,
    caffeine_mg: 185,
    water_ml: 2100,
};
const GOALS = {
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fat_g: 70,
    fiber_g: 30,
    sugar_g: 45,
    alcohol_g: 20,
    caffeine_mg: 400,
    water_ml: 2500,
};
// Two meals carrying every metric the strip shows — except alcohol, which both
// record as a real 0. That is not padding: it makes this fixture cover both
// halves of the per-tile gate at once, since a tile is a button only when some
// meal actually contributed to it.
const MEALS = [
    {
        description: "Porridge",
        meal_type: "breakfast",
        calories: 400,
        protein_g: 12,
        carbs_g: 60,
        fat_g: 8,
        fiber_g: 9.4,
        sugar_g: 12.2,
        alcohol_g: 0,
        caffeine_mg: null,
    },
    {
        description: "Flat white",
        meal_type: "snack",
        calories: 120,
        protein_g: 6,
        carbs_g: 9,
        fat_g: 6,
        fiber_g: 0,
        sugar_g: 8.1,
        alcohol_g: 0,
        caffeine_mg: 185,
    },
];

// Every tile that is a button, by macro key → its accessible name.
function tileLabels(html: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const m of html.matchAll(
        /data-macro="([^"]+)"[^>]*aria-label="([^"]*)"/g,
    ))
        out[m[1]!] = m[2]!;
    return out;
}

test("an interactive tile names its value and goal state, then the action", () => {
    const labels = tileLabels(
        macrosApi.macroPanel(VALS, GOALS, undefined, MEALS),
    );
    expect(labels.calories).toBe(
        "Calories 2,035 kcal, of 2,200 kcal, 165 kcal left. Show the meals that contributed.",
    );
    expect(labels.carbs_g).toBe(
        "Carbs 205 g, of 220 g, 15 g left. Show the meals that contributed.",
    );
    // A limit cell is a button on the same terms as a macro bar — every metric
    // on the strip is in MEAL_BREAKDOWN_ITEM, so "tap a metric" means any of
    // them. Its name carries the ceiling and the distance to it.
    expect(labels.sugar_g).toBe(
        "Sugar 58.2 g, limit 45 g, 13.2 g over. Show the meals that contributed.",
    );
    expect(labels.caffeine_mg).toBe(
        "Caffeine 185 mg, limit 400 mg, 215 mg under. Show the meals that contributed.",
    );
    // Alcohol is the exception, and not by type: both meals recorded a real 0,
    // so there is nothing behind that cell and it stays the static cell it
    // always was rather than a button onto an empty list.
    expect(Object.keys(labels).sort()).toEqual([
        "caffeine_mg",
        "calories",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "protein_g",
        "sugar_g",
    ]);
});

// The gate is per tile, not per strip: the same panel can hold a button and a
// static cell of the same kind, decided only by whether a meal contributed.
test("a limit cell is a button only when meals are behind it", () => {
    const withAlcohol = [
        { ...MEALS[0], description: "Pinot", alcohol_g: 12.5 },
    ];
    expect(
        tileLabels(macrosApi.macroPanel(VALS, GOALS, undefined, withAlcohol))
            .alcohol_g,
    ).toBe(
        "Alcohol 12.5 g, limit 20 g, 7.5 g under. Show the meals that contributed.",
    );
    // …and a metric no meal touched is not tappable even though its cell is on
    // screen: a recorded 0 earns alcohol and caffeine a cell (that is the whole
    // point of their null signal), but never a button onto nothing.
    const zeroed = { ...VALS, alcohol_g: 0, caffeine_mg: 0 };
    const html = macrosApi.macroPanel(zeroed, GOALS, undefined, [
        { ...MEALS[0], alcohol_g: 0, caffeine_mg: 0 },
    ]);
    expect(html).toContain("none logged");
    expect(tileLabels(html).alcohol_g).toBeUndefined();
    expect(tileLabels(html).caffeine_mg).toBeUndefined();
});

// A single meal contributes a fraction of the day, so the breakdown needs a
// finer figure than the strip above it — but only where the unit has one. Both
// halves matter: without the tenth a 12.2 g and an 8.1 g meal sort into an
// order the list does not explain, and with it caffeine reads "185.0 mg".
test("the breakdown gives grams a tenth and keeps whole units whole", () => {
    const list = (key: string, meals: unknown[] = MEALS) =>
        macrosApi.mealList(macroOf(key), meals);
    const val = (key: string, v: number) =>
        list(key, [{ description: "One meal", [key]: v }]);
    // Grams to a tenth, whatever the strip above rounds them to: the macro
    // bars show whole grams, the limits row a tenth, and the breakdown under
    // both is at meal scale.
    expect(val("protein_g", 42.4)).toContain(
        '42.4<span class="md-unit">g</span>',
    );
    expect(val("sugar_g", 12.24)).toContain(
        '12.2<span class="md-unit">g</span>',
    );
    // Whole units stay whole — kcal, and the milligrams the payload happens to
    // round to a tenth.
    expect(val("caffeine_mg", 185.4)).toContain(
        '185<span class="md-unit">mg</span>',
    );
    expect(val("calories", 400)).toContain(
        '400<span class="md-unit">kcal</span>',
    );
    // Sorted largest-first, and a meal that contributed none of the metric is
    // left out entirely rather than listed as a 0.
    expect(list("caffeine_mg")).toContain("Flat white");
    expect(list("caffeine_mg")).not.toContain("Porridge");
});

// Hover and a cursor are the whole affordance on a pointer device, and a
// phone has neither — the tappable tiles are the same shape as the static
// limit cells beside them. Without a line saying what a tap does, the
// breakdown is a feature nobody discovers.
test("a strip that discloses something says so; one that does not stays quiet", () => {
    expect(macrosApi.macroPanel(VALS, GOALS, undefined, MEALS)).toContain(
        "Tap a metric for the meals behind it",
    );
    expect(macrosApi.macroPanel(VALS, GOALS)).not.toContain("data-macro-hint");
});

// The strip trends builds. Fiber and sugar used to be reachable only by
// tapping carbs, which made that one tile a button even with no meals behind
// it; they now have cells of their own in the limits row, so a strip built
// without meals discloses nothing and is entirely static.
test("without meals nothing is a button, and fiber and sugar are on show anyway", () => {
    const html = macrosApi.macroPanel(VALS, GOALS);
    expect(tileLabels(html)).toEqual({});
    expect(html).not.toContain("data-macro-panel");
    expect(html).toContain("Fiber");
    expect(html).toContain("Sugar");
});

test("no goal is still a value, not a bare action", () => {
    const labels = tileLabels(
        macrosApi.macroPanel(VALS, null, undefined, MEALS),
    );
    expect(labels.protein_g).toBe(
        "Protein 148 g, no goal set. Show the meals that contributed.",
    );
});

// A regression net over every shape the panel can take: whatever the wording
// ends up being, the number must be in the name.
test("every interactive tile carries its formatted value, and none is spoken as '·'", () => {
    const cases: Array<[Vals, Vals | null, { under?: string } | undefined]> = [
        [VALS, GOALS, undefined],
        [VALS, GOALS, { under: "under" }],
        [VALS, null, undefined],
        [{ ...VALS, fat_g: 0, calories: 4120 }, GOALS, undefined],
    ];
    for (const [vals, goal, wording] of cases) {
        const labels = tileLabels(
            macrosApi.macroPanel(vals, goal, wording, MEALS),
        );
        expect(Object.keys(labels).length).toBeGreaterThan(0);
        for (const [key, label] of Object.entries(labels)) {
            const m = macroOf(key) as Macro & {
                label: string;
                unit: string;
                decimals: number;
            };
            // At the tile's own precision, so the spoken value reads exactly
            // as the one on screen — a tenth for the limits row, whole for
            // calories, the macro bars and caffeine's milligrams.
            expect(
                label.startsWith(
                    `${m.label} ${fmt(vals[key]!, m.decimals)} ${m.unit},`,
                ),
            ).toBe(true);
            // "·" is decoration a screen reader either skips or calls
            // "middle dot"; the spoken name separates with a comma.
            expect(label).not.toContain("·");
        }
    }
});

// The static tiles are the reason the button ones needed fixing — they were
// always readable, and must stay that way.
test("a static tile keeps its label, figure and goal caption exposed", () => {
    const html = macrosApi.macroPanel(VALS, GOALS);
    expect(html).toContain('aria-label="Calories 2,035 kcal"');
    expect(html).toContain(
        '148<span class="msub">/160<span class="munit"> g</span></span>',
    );
    expect(html).toContain("12 g left");
    // …and is not a button, so those children are not presentational.
    expect(html).not.toContain('data-macro="protein_g"');
});

// ---- no goal, and the goal of 0 that means the same thing ------------------
//
// A strip with no goals is a real state (get_goal_progress, get_trends and
// get_nutrition_summary all send `goals: null`), and it has to SAY so — a bare
// figure beside an empty ring reads as a widget that failed to load. The
// calorie block has exactly one slot for it.
test("with no goals every tile says so, calorie block included", () => {
    const html = macrosApi.macroPanel(VALS, null);
    expect(html).toContain('<div class="cal-left">no goal set</div>');
    expect(html).not.toContain("cal-goal");
    // …and the macro captions opt out of the phone layout's caption hiding,
    // because there is no "148/160" to imply the goal instead.
    expect(html).toContain('class="mtile nogoal"');
});

// A floor target of 0 is "no goal set" (a 0 g protein goal is meaningless) —
// but set_nutrition_goals stores it happily, so every figure has to agree with
// that caption instead of rendering "/ 0" beside it.
test("a floor goal of 0 never reaches the figure", () => {
    const zeroed = { calories: 0, protein_g: 0, water_ml: 0 };
    const html = macrosApi.macroPanel(VALS, zeroed);
    expect(html).not.toContain("/ 0<");
    expect(html).not.toContain("/0<");
    expect(html).not.toContain("/0.0 L");
    expect(html).toContain("no goal set");
});

// ---- the limits row -------------------------------------------------------
//
// One row, one to four cells, no special cases: alcohol simply is or is not
// among them, and the column count travels with the markup.
const limitKeys = (html: string) =>
    [...html.matchAll(/<span class="mkey">([^<]+)<\/span>/g)]
        .map((m) => m[1]!)
        .slice(3); // the first three are protein / carbs / fat

test("the limits row is sugar, alcohol, caffeine, fiber — in that order", () => {
    expect(limitKeys(macrosApi.macroPanel(VALS, GOALS))).toEqual([
        "Sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
});

test("alcohol tracking off drops its cell and the row stays three-up", () => {
    const html = macrosApi.macroPanel({ ...VALS, alcohol_g: null }, GOALS);
    expect(limitKeys(html)).toEqual(["Sugar", "Caffeine", "Fiber"]);
    expect(html).toContain("--lc:3;--lcw:3");
    // Four cells do not fit across a phone, so they become a 2×2 there and
    // stay one row from 560px up.
    expect(macrosApi.macroPanel(VALS, GOALS)).toContain("--lc:2;--lcw:4");
});

// Grams of ethanol mean nothing to most people; the caption leads with the
// count the server quotes in its own text.
test("alcohol's caption leads with the drink count, in the user's unit", () => {
    expect(macrosApi.macroPanel(VALS, GOALS)).toContain(
        "0.9 US drinks · limit 20 g",
    );
    expect(
        macrosApi.macroPanel(VALS, GOALS, undefined, undefined, {
            drinkUnit: "uk",
        }),
    ).toContain("1.6 UK units · limit 20 g");
});

// A limit cell's caption is the limit itself; the distance to it joins only
// when that is the thing to act on. Under a limit the distance is noise in a
// cell this size — but a breach earns its space, and "at limit" is a state the
// --over colour cannot express (`over` is pct > 100, so exactly at a ceiling
// would otherwise look comfortably under it).
test("a breached or exactly-met limit says by how much; an unbreached one does not", () => {
    const cap = (vals: Vals, goal: Vals | null) => {
        const m = /<div class="mcap">([^<]*)<\/div>/.exec(
            macrosApi.macroLimit(
                macroOf("sugar_g"),
                macrosApi.macroCtxOf(vals, goal),
            ),
        );
        return m?.[1] ?? "";
    };
    expect(cap({ sugar_g: 31.9 }, { sugar_g: 45 })).toBe("limit 45 g");
    expect(cap({ sugar_g: 58.1 }, { sugar_g: 45 })).toBe(
        "limit 45 g · 13.1 g over",
    );
    expect(cap({ sugar_g: 45 }, { sugar_g: 45 })).toBe("limit 45 g · at limit");
    expect(cap({ sugar_g: 31.9 }, null)).toBe("no goal set");
});

// TOTALS_ITEM types fiber_g and sugar_g as plain numbers, so a day that
// predates the column is indistinguishable from a genuine zero — the cell has
// to be earned by a value or by a goal of the user's own. Alcohol and caffeine
// carry a real null for that, so their recorded 0 always shows.
test("fiber and sugar earn a cell with data or a goal; alcohol's 0 always shows", () => {
    const bare = { calories: 500, protein_g: 20, carbs_g: 60, fat_g: 10 };
    expect(
        limitKeys(macrosApi.macroPanel({ ...bare, fiber_g: 0 }, null)),
    ).toEqual([]);
    expect(
        limitKeys(
            macrosApi.macroPanel({ ...bare, fiber_g: 0 }, { fiber_g: 30 }),
        ),
    ).toEqual(["Fiber"]);
    expect(
        limitKeys(macrosApi.macroPanel({ ...bare, fiber_g: 4.2 }, null)),
    ).toEqual(["Fiber"]);
    expect(
        limitKeys(macrosApi.macroPanel({ ...bare, alcohol_g: 0 }, null)),
    ).toEqual(["Alcohol"]);
});

// The payload is millilitres because that is what a glass is logged in; a
// day's intake is read in litres.
test("water reads in litres, and an untracked day has no line at all", () => {
    expect(macrosApi.macroPanel(VALS, GOALS)).toContain(
        '2.1<span class="wsub">/2.5 L</span>',
    );
    expect(macrosApi.macroPanel({ ...VALS, water_ml: 0 }, GOALS)).not.toContain(
        "wrow",
    );
});

// ---- caffeine: milligrams, a ceiling, and no invented zero ----------------
//
// The one nutrient not measured in grams, and the one with no profile opt-in to
// hide it — so the null in the payload is the whole display gate.
const caffeineCell = (vals: Vals, goal: Vals | null) =>
    macrosApi.macroLimit(
        macroOf("caffeine_mg"),
        macrosApi.macroCtxOf(vals, goal),
    );

test("caffeine reads in whole milligrams against a ceiling", () => {
    expect(line("caffeine_mg", 320, 400)).toBe("limit 400 mg · 80 mg under");
    expect(line("caffeine_mg", 470, 400)).toBe("limit 400 mg · 70 mg over");
    // Whole milligrams even though the payload rounds to a tenth like its
    // siblings: a tenth of a milligram is below anything anyone can act on.
    expect(line("caffeine_mg", 95.4, 400)).toBe("limit 400 mg · 305 mg under");
});

// "None today" is a limit people really set, the same way it is for alcohol.
test("a caffeine limit of 0 is a real limit", () => {
    expect(line("caffeine_mg", 0, 0)).toBe("limit 0 mg · at limit");
    expect(line("caffeine_mg", 95, 0)).toBe("limit 0 mg · 95 mg over");
});

// The trap from issue #78: most meals predate the column and carry NULL, so a
// user who has never recorded caffeine must not be congratulated on being
// 400 mg under a limit they never went near.
test("caffeine never recorded renders nothing; a recorded 0 stays", () => {
    expect(caffeineCell({ caffeine_mg: null }, GOALS)).toBe("");
    expect(caffeineCell({ caffeine_mg: 0 }, GOALS)).toContain("none logged");
    expect(
        macrosApi.macroPanel({ ...VALS, caffeine_mg: null }, GOALS),
    ).not.toContain("Caffeine");
    expect(macrosApi.macroPanel(VALS, GOALS)).toContain("Caffeine");
});

test("caffeine is milligrams alone — the drink gloss is alcohol's only", () => {
    const html = caffeineCell({ caffeine_mg: 185 }, GOALS);
    // The limit underneath carries the unit; with no limit to carry it, the
    // one unit here nobody can guess goes back beside the figure.
    expect(html).toContain('<span class="mnum">185</span>');
    expect(html).toContain("limit 400 mg");
    expect(caffeineCell({ caffeine_mg: 185 }, null)).toContain(
        '185<span class="msub"> mg</span>',
    );
    expect(html).not.toContain("drinks");
    expect(
        macrosApi.macroLimit(
            macroOf("alcohol_g"),
            macrosApi.macroCtxOf({ alcohol_g: 28 }, GOALS),
        ),
    ).toContain("US drinks");
});

// Caffeine carries zero kcal, so it is a limit cell and nothing else: never a
// macro bar, never a segment of an energy split, and never evidence that a day
// was logged. Being tappable does not change that — the limits row discloses
// its meals exactly like the bars above it while staying a different kind of
// thing.
test("caffeine is a limit, not a macro", () => {
    const m = macroOf("caffeine_mg") as Macro & {
        role: string;
        parent?: string;
    };
    expect(m.role).toBe("limit");
    expect(m.parent).toBeUndefined();
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    // limitKeys drops the first three names, which are the macro bars — so
    // finding Caffeine here is proof it is not one of them.
    expect(limitKeys(html)).toContain("Caffeine");
    expect(macrosApi.dayHasData({ caffeine_mg: 185 })).toBe(false);
});

// ---- import widget: the alcohol opt-in ------------------------------------
//
// The map step is evaluated the way the assembler ships it: the real assembled
// widget (bridge + the transpiled csv.ts + the template) is run as one script
// with only the `initWidget({…})` bootstrap cut off, because that line is the
// one that reaches for window.parent. Everything below therefore exercises the
// same code a host runs, not a paraphrase of it.
const importWidget = await (async () => {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("import-meals");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("import-meals bootstrap not found");
    const factory = new Function(
        `${script.slice(0, boot)}
         return {
             S,
             setDrinkUnit: (u) => { CFG = Object.assign({}, CFG, { drink_unit: u }); },
             autoMap,
             mapStep,
             buildRows,
             previewStep,
         };`,
    );
    return factory() as {
        S: Record<string, unknown> & {
            mapping: Record<string, number>;
            rows: Record<string, unknown>[];
        };
        setDrinkUnit: (u: string | null) => void;
        autoMap: () => void;
        mapStep: () => string;
        buildRows: () => void;
        previewStep: () => string;
    };
})();

// Render the map step over a one-row file. Returns its HTML.
function mapStepFor(
    headers: string[],
    row: string[],
    drinkUnit: string | null,
) {
    const w = importWidget;
    w.setDrinkUnit(drinkUnit);
    w.S.table = {
        headers,
        rows: [row],
        sourceLines: [2],
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
    w.S.sourceApp = "";
    w.S.dateFormat = "iso";
    w.S.dateAmbiguous = false;
    w.S.energyUnit = "kcal";
    w.autoMap();
    return w.mapStep();
}

const WITH_ALCOHOL = [
    ["Date", "Food Name", "Energy (kcal)", "Alcohol (g)"],
    ["2026-07-18", "Pinot noir", "610", "17.4"],
] as const;
const NO_ALCOHOL = [
    ["Date", "Food Name", "Energy (kcal)", "Protein (g)"],
    ["2026-07-18", "Porridge", "310", "9.2"],
] as const;

// The gate is silent by design, and alcohol_g sits outside the import digest
// (CONTRACT §2) — so importing with tracking off and re-running the file after
// turning it on dedupes to a no-op that back-fills nothing. Unrecoverable and
// unannounced is the combination this notice exists to break.
test("a file with alcohol data says so when tracking is off", () => {
    const html = mapStepFor(WITH_ALCOHOL[0], WITH_ALCOHOL[1], null);
    expect(html).toContain("alcohol tracking is off");
    expect(html).toContain("will not be imported");
    // Names the column — the user's own header text — so they can tell which
    // one is meant, and names the way to keep it.
    expect(html).toContain("This file has an alcohol column (Alcohol (g))");
    expect(html).toContain("set_alcohol_tracking");
    // But never a parsed figure: suppressing those is the whole point of the
    // opt-in, and the gate must not be undone by the notice about it.
    expect(html).not.toContain("17.4");
    // Nor is the column offered for mapping while tracking is off.
    expect(html).not.toContain('data-field="alcohol_g"');
});

test("no notice when the user tracks alcohol — the column just imports", () => {
    const html = mapStepFor(WITH_ALCOHOL[0], WITH_ALCOHOL[1], "us");
    expect(html).not.toContain("alcohol tracking is off");
    expect(html).toContain('data-field="alcohol_g"');
});

test("no notice when the file has no alcohol column", () => {
    const html = mapStepFor(NO_ALCOHOL[0], NO_ALCOHOL[1], null);
    expect(html).not.toContain("alcohol tracking is off");
    expect(html).not.toContain("alcohol column");
});

// The wording is a claim about presence, so it must not fire on a header that
// merely looks alcoholic. Sugar alcohols are polyols and ABV is a percentage,
// neither of which is grams of ethanol — both are excluded from ALIASES, and
// the notice reuses that list rather than a second one that could drift.
test("the notice reuses the gate's alias list, not a looser match", () => {
    const html = mapStepFor(
        ["Date", "Food Name", "Sugar Alcohols (g)", "ABV"],
        ["2026-07-18", "Protein bar", "4.1", "0"],
        null,
    );
    expect(html).not.toContain("alcohol tracking is off");
});

// The importer parses the file in the browser, so its gate cannot be exercised
// from here; what is pinned is the part that made the leak possible, namely
// which way an absent drink_unit defaults.
test("the importer defaults to alcohol tracking OFF", async () => {
    const html = await Bun.file(`${SRC}/templates/import-meals.html`).text();
    const cfg = html.slice(html.indexOf("let CFG = {"));
    expect(cfg.slice(0, cfg.indexOf("};"))).toContain("drink_unit: null");
    // Only the two values the server's schema can emit turn it on.
    expect(html).toContain(
        'CFG.drink_unit === "us" || CFG.drink_unit === "uk"',
    );
    // Nothing leaves the browser unless it is on.
    expect(html).toContain("alcohol_g: alcoholTracked()");
});

// ---- import widget: caffeine is milligrams, and the header has to say so ---
//
// The whole naming contract exists to stop one specific import: a column headed
// "Caffeine (g)" binding to the milligram field and storing 0.18 where the
// user's own label reads 180 mg — legal, silent, and reported as a clean
// import. The guard is three parts (an ALIASES list carrying no _g spelling,
// CAFFEINE_GRAMS_RE, and the notice that explains the blank row), so all three
// are pinned here; deleting any one of them left every test passing.
const CAF_MG = [
    ["Date", "Food Name", "Energy (kcal)", "Caffeine (mg)"],
    ["2026-07-18", "Flat white", "120", "185"],
] as const;
const CAF_G = [
    ["Date", "Food Name", "Energy (kcal)", "Caffeine (g)"],
    ["2026-07-18", "Flat white", "120", "0.185"],
] as const;

test("a milligram caffeine column auto-maps, with no opt-in to satisfy", () => {
    // Both drink_unit states, because caffeine deliberately has no
    // alcohol-style gate: the alcohol opt-in must not reach it in either
    // direction.
    for (const unit of [null, "us"]) {
        const html = mapStepFor(CAF_MG[0], CAF_MG[1], unit);
        // The row is always rendered, so the selected index is what proves the
        // column bound — and the sample cell is what the user sees confirm it.
        expect(html).toContain('data-field="caffeine_mg"');
        expect(importWidget.S.mapping.caffeine_mg).toBe(3);
        expect(html).toContain(
            '<div class="map-src">Caffeine (mg)</div><div class="map-sample">e.g. 185</div>',
        );
        expect(html).not.toContain("is in grams");
    }
});

test("a bare 'Caffeine' header maps too — the unit is only ever mg", () => {
    const html = mapStepFor(
        ["Date", "Food Name", "Energy (kcal)", "Caffeine"],
        ["2026-07-18", "Flat white", "120", "185"],
        null,
    );
    expect(html).toContain('data-field="caffeine_mg"');
    expect(importWidget.S.mapping.caffeine_mg).toBe(3);
});

test("a caffeine column headed in GRAMS is refused, and the notice says why", () => {
    const html = mapStepFor(CAF_G[0], CAF_G[1], null);
    // Never auto-mapped — this is the 1000x error the contract is about.
    expect(importWidget.S.mapping.caffeine_mg).toBe(-1);
    expect(html).toContain("is in grams");
    // Names the user's own header text, like the alcohol notice, so they can
    // tell which column is meant.
    expect(html).toContain("caffeine column (Caffeine (g))");
    // And says the loss is permanent: caffeine_mg sits outside the import
    // digest, so a re-import of the corrected file dedupes to a no-op.
    expect(html).toContain("will not fill it in");
    expect(html).toContain("before importing, not after");
});

test("caffeine reaches the row only when a column is mapped to it", () => {
    mapStepFor(CAF_MG[0], CAF_MG[1], null);
    importWidget.buildRows();
    expect(importWidget.S.rows[0]!.caffeine_mg).toBe(185);
    // And the user sees it before confirming, in milligrams. The preview
    // column is data-driven like fiber and sugar — not gated on an opt-in.
    const preview = importWidget.previewStep();
    expect(preview).toContain("Caf mg");
    expect(preview).toContain("185");

    // No caffeine column at all: the key is absent rather than a fabricated 0,
    // which is what keeps a pre-feature-shaped export out of the averages.
    mapStepFor(NO_ALCOHOL[0], NO_ALCOHOL[1], null);
    importWidget.buildRows();
    expect(importWidget.S.rows[0]!.caffeine_mg).toBeUndefined();
    expect(importWidget.previewStep()).not.toContain("Caf mg");

    // And a grams-headed column stays out of the payload entirely.
    mapStepFor(CAF_G[0], CAF_G[1], null);
    importWidget.buildRows();
    expect(importWidget.S.rows[0]!.caffeine_mg).toBeUndefined();
});
