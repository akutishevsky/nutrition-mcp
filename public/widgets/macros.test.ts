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
type Macro = {
    key: string;
    direction?: string;
    role?: string;
    color?: string;
    glyph?: string;
};
type Vals = Record<string, number | null>;
const macrosApi = await (async () => {
    // shared/i18n.js, then shared/icon.js, then shared/macros.js — exactly the
    // order every template includes them in. macros.js reads T/tpl/plural from
    // the first and calls icon() from the second for its chevrons, the drawer's
    // ✕ and the hint chip, so without icon.js every assertion below dies on
    // `icon is not defined` before the first one runs. Only the "en" dictionary
    // is wired in (WIDGET_STRINGS = { en: ... }): these tests assert English
    // wording, and macroLabel()/T.macros.* fall back to English by construction
    // whenever a locale is missing.
    const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
    const iconSrc = await Bun.file(`${SRC}/shared/icon.js`).text();
    // shared/date.js too, exactly as nutrition-summary.html includes it: a
    // drawer row's day goes through shortDate(). macros.js guards that call
    // (`typeof shortDate === "function"`) because the dev gallery includes
    // macros.js WITHOUT date.js, so both shapes are safe — what is pinned below
    // is the real path.
    const dateSrc = await Bun.file(`${SRC}/shared/date.js`).text();
    const macrosSrc = await Bun.file(`${SRC}/shared/macros.js`).text();
    // `document`/`window` are left undefined so the partial's delegated event
    // wiring (guarded by `typeof document`) stays out of the way.
    const factory = new Function(
        "fmt",
        "esc",
        "WIDGET_STRINGS",
        `${i18nSrc}\n${iconSrc}\n${dateSrc}\n${macrosSrc}\nreturn { macroBits, MACROS, GLYPHS, macroPanel, macroLimit, macroCtxOf, dayHasData, mealList, macroDetailBody, focusInner, focusOver, macroDecimal, setLocale };`,
    );
    // "de" is wired to the English dictionary deliberately: the locale test
    // below pins that FIGURES follow the widget's locale, not that any
    // particular German wording is present.
    return factory(fmt, esc, {
        en: WIDGET_STRINGS_EN,
        de: WIDGET_STRINGS_EN,
    }) as {
        macroBits: (
            m: Macro,
            vals: Record<string, number>,
            goal: Record<string, number> | null,
            wording?: { under?: string; over?: string },
        ) => Bits;
        MACROS: Macro[];
        GLYPHS: Record<string, { d: string; evenodd?: boolean }>;
        macroPanel: (
            vals: Vals,
            goal?: Vals | null,
            wording?: { under?: string; over?: string },
            meals?: unknown[],
            opts?: {
                drinkUnit?: string;
                chartKeys?: string[];
                tiers?: boolean;
            },
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
        mealList: (m: Macro, meals: unknown[], flag?: string) => string;
        macroDetailBody: (m: Macro, ctx: unknown) => string;
        focusInner: (m: Macro, ctx: unknown, control?: boolean) => string;
        focusOver: (m: Macro, b: Bits & { val: number }) => boolean;
        macroDecimal: (v: number, decimals: number) => string;
        setLocale: (locale: string) => unknown;
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
//
// A SOBER DAY IS NOT "AT LIMIT". Nothing consumed against a limit of 0 used to
// read "limit 0 g · at limit" — the phrasing of someone who has used their
// allowance up, for the day they kept the limit perfectly. It reads as the
// limit alone.
test("a ceiling target of 0 is a real limit", () => {
    expect(line("alcohol_g", 0, 0)).toBe("limit 0 g");
    const sober = macrosApi.macroBits(
        macroOf("alcohol_g"),
        { alcohol_g: 0 },
        { alcohol_g: 0 },
    ) as Bits & { atLimit: boolean; deltaStr: string };
    expect(sober.atLimit).toBe(false);
    expect(sober.over).toBe(false);
    expect(sober.deltaStr).toBe("");
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
// `role="button"` makes a tile's children presentational, so the gauge's own
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

// The markup of one chip, from its opening tag to its closing one — the handle
// for anything that is about a single chip's own attributes or children.
function chipHtml(html: string, key: string): string {
    const i = html.indexOf(`data-macro="${key}"`);
    if (i === -1) return "";
    return html.slice(html.lastIndexOf("<", i), html.indexOf("</button>", i));
}

// The attributes an interactive chip carries, by macro key.
function chipAttrs(html: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const m of html.matchAll(/data-macro="([^"]+)"([^>]*)/g))
        out[m[1]!] = m[2]!;
    return out;
}

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
    // The VISIBLE figure verbatim ("2,035/2,200 kcal"), then only what the
    // figure does not already say — WCAG 2.5.3 label-in-name. It used to read
    // "2,035 kcal, of 2,200 kcal", which does not contain what the tile shows.
    expect(labels.calories).toBe(
        "Calories 2,035/2,200 kcal, 165 kcal left. Show the meals that contributed.",
    );
    expect(labels.carbs_g).toBe(
        "Carbs 205/220 g, 15 g left. Show the meals that contributed.",
    );
    // A limit cell is a button on the same terms as a macro bar — every metric
    // on the strip is in MEAL_BREAKDOWN_ITEM, so "tap a metric" means any of
    // them. Its name carries the ceiling — "/45" does not say it is a limit —
    // and the distance to it.
    expect(labels.sugar_g).toBe(
        "Sugar 58.2/45 g, limit 45 g, 13.2 g over. Show the meals that contributed.",
    );
    expect(labels.caffeine_mg).toBe(
        "Caffeine 185/400 mg, limit 400 mg, 215 mg under. Show the meals that contributed.",
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
        "Alcohol 12.5/20 g, limit 20 g, 7.5 g under. Show the meals that contributed.",
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
    expect(val("protein_g", 42.4)).toContain('42.4<span class="u">g</span>');
    expect(val("sugar_g", 12.24)).toContain('12.2<span class="u">g</span>');
    // Whole units stay whole — kcal, and the milligrams the payload happens to
    // round to a tenth.
    expect(val("caffeine_mg", 185.4)).toContain('185<span class="u">mg</span>');
    expect(val("calories", 400)).toContain('400<span class="u">kcal</span>');
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

// TWO SPECIES OF CONTROL, and conflating them was a real defect: every one of
// trends' eight chips announced itself as expandable while no `.drawer` element
// existed anywhere in that document, and nutrition-summary's Water chip did the
// same. A chip that opens the drawer is a DISCLOSURE (aria-expanded +
// aria-controls); a chip that only re-strokes the chart is a TOGGLE
// (aria-pressed), and it drops the chevron so the affordance matches.
test("a disclosing chip says aria-expanded; a chart-only chip says aria-pressed", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, {
        chartKeys: ["protein_g", "water_ml"],
    });
    const attrs = chipAttrs(html);

    // Protein: meals behind it, so a disclosure pointing at the drawer.
    expect(attrs.protein_g).toContain('aria-expanded="false"');
    expect(attrs.protein_g).toContain('aria-controls="macro-drawer"');
    expect(attrs.protein_g).not.toContain("aria-pressed");
    expect(chipHtml(html, "protein_g")).toContain('class="chev"');

    // Water: no meal row carries water_ml, so nothing can open. It is a chart
    // toggle and says so — and shows no disclosure chevron.
    expect(attrs.water_ml).toContain('aria-pressed="false"');
    expect(attrs.water_ml).not.toContain("aria-expanded");
    expect(attrs.water_ml).not.toContain("aria-controls");
    expect(chipHtml(html, "water_ml")).not.toContain('class="chev"');

    // The drawer exists exactly once, is not a live region (an announcement
    // that never fires is worse than none — focus is moved into it instead),
    // and is focusable so that move can happen.
    expect(html.match(/<div class="drawer"/g)).toHaveLength(1);
    expect(html).not.toContain("aria-live");
    expect(html).toContain('tabindex="-1"');
});

// "Also shows this nutrient on the chart." is a promise about THIS chip. Gated
// on the widget merely having a chart, nutrition-summary's calorie hero — which
// chartableKeys() deliberately excludes — promised a chart change that tapping
// it never made (regression audit).
test("only a chip the chart can actually draw claims to re-stroke it", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, {
        chartKeys: ["protein_g"],
    });
    const labels = tileLabels(html);
    expect(labels.protein_g).toContain(WIDGET_STRINGS_EN.macros.alsoChart);
    expect(labels.calories).not.toContain(WIDGET_STRINGS_EN.macros.alsoChart);
    expect(labels.calories).toBe(
        "Calories 2,035/2,200 kcal, 165 kcal left. Show the meals that contributed.",
    );
});

// "Also" refers back to the meals sentence, so it may only follow it. A chip
// that ONLY re-strokes the chart had the meals sentence sliced off by length and
// kept the "Also …" — nutrition-summary's Water, and every tile of a range whose
// payload carries `meals: []`.
test("a chart-only chip says what it does, with no dangling 'Also'", () => {
    const { showOnChart, alsoChart, showMealsContributed } =
        WIDGET_STRINGS_EN.macros;
    const noMeals = tileLabels(
        macrosApi.macroPanel(VALS, GOALS, undefined, [], {
            chartKeys: ["protein_g", "water_ml", "sugar_g"],
        }),
    );
    expect(Object.keys(noMeals).sort()).toEqual([
        "protein_g",
        "sugar_g",
        "water_ml",
    ]);
    for (const label of Object.values(noMeals)) {
        expect(label.endsWith(` ${showOnChart}`)).toBe(true);
        expect(label).not.toContain(alsoChart);
        expect(label).not.toContain(showMealsContributed);
    }
    // Both effects: the meals sentence, and THEN "also".
    const both = tileLabels(
        macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, {
            chartKeys: ["protein_g"],
        }),
    );
    expect(both.protein_g).toBe(
        `Protein 148/160 g, 12 g left. ${showMealsContributed} ${alsoChart}`,
    );
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
// ends up being, the name must CONTAIN WHAT THE TILE SHOWS (WCAG 2.5.3) — its
// label followed by its figure, exactly as rendered. Read off the markup rather
// than rebuilt here, so a figure format change that forgets the name fails.
// Whitespace is ignored: the unit's gap is a CSS margin on screen and a space
// in the name, and label-in-name matching is not about spacing.
test("every interactive tile's name contains its visible label and figure, and none is spoken as '·'", () => {
    const cases: Array<[Vals, Vals | null, { under?: string } | undefined]> = [
        [VALS, GOALS, undefined],
        [VALS, GOALS, { under: "under" }],
        [VALS, null, undefined],
        [{ ...VALS, fat_g: 0, calories: 4120 }, GOALS, undefined],
        [{ ...VALS, sugar_g: 0, protein_g: 159.6 }, GOALS, undefined],
    ];
    const squash = (s: string) => s.replace(/\s+/g, "");
    for (const [vals, goal, wording] of cases) {
        const html = macrosApi.macroPanel(vals, goal, wording, MEALS);
        const labels = tileLabels(html);
        expect(Object.keys(labels).length).toBeGreaterThan(0);
        for (const [key, label] of Object.entries(labels)) {
            const chip = chipHtml(html, key);
            // The focus panel carries the calorie control; its figure sits in
            // `.fmain .v`, ahead of its meta line rather than its caption.
            const from = chip.indexOf('<span class="v">');
            const to =
                key === "calories"
                    ? chip.indexOf('<span class="fmeta">')
                    : chip.indexOf('<span class="dcap">');
            expect(from).toBeGreaterThan(-1);
            const figure = chip.slice(from, to).replace(/<[^>]*>/g, "");
            const m = macroOf(key) as Macro & { label: string };
            expect(
                squash(label).startsWith(squash(`${m.label}${figure}`)),
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
    // The calorie hero is a metric tile too now, and a static one is a <span>:
    // its label, figure and caption are ordinary exposed text rather than a
    // gauge's aria-label standing in for them (the donut, and that label, went
    // when the wash became the gauge).
    expect(html).toContain('<span class="focus c-cal"');
    expect(html).toContain('2,035<span class="u">/2,200 kcal</span>');
    expect(html).toContain(
        '<span class="dcap">of 2,200 kcal · 165 kcal left</span>',
    );
    // The goal RIDES THE FIGURE on a static chip, dimmed: "148 /160 g". It used
    // to sit in the caption alone, and the caption is `clip-path` hidden with no
    // drawer behind a static chip to reveal it — so a goal the old build printed
    // under every tile became unreachable for a sighted user (regression audit).
    // An interactive chip still prints the bare figure; its goal is one tap away.
    expect(html).toContain('148<span class="u">/160 g</span>');
    // …and the caption still carries the whole goal line for a screen reader.
    expect(html).toContain("12 g left");
    // …and is not a button, so those children are not presentational.
    expect(html).not.toContain('data-macro="protein_g"');
});

// The other half of that rule: a chip you CAN tap keeps the bare figure, because
// its drawer prints the goal in full and the rail has to stay narrow.
// EVERY tile prints its figure against its goal, tappable or not. The goal used
// to be drawer-only on an interactive chip, which made a metric's own target
// something you had to go looking for — and once the over-a-ceiling warning
// marker was dropped it left the breach carried by hue alone. "58.2/45 g" is
// the informational cue that replaced it, so this is load-bearing for more than
// convenience.
test("every tile prints its figure against its goal; with no goal, the figure alone", () => {
    const live = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    expect(live).toContain('148<span class="u">/160 g</span>');
    // The breach reads in numbers, not only in colour.
    expect(live).toContain('58.2<span class="u">/45 g</span>');
    // No goal to measure against: the figure stands alone rather than being
    // printed against nothing.
    const noGoals = macrosApi.macroPanel(VALS, null, undefined, MEALS);
    expect(noGoals).toContain('148<span class="u">g</span>');
    expect(noGoals).not.toContain('148<span class="u">/');
    // A goal of 0 is never printed beside a figure — "5.2 /0 g" reads as a typo,
    // and the ceiling-0 breach is carried by the caption.
    const zeroCeiling = macrosApi.macroPanel(
        { ...VALS, alcohol_g: 5.2 },
        { ...GOALS, alcohol_g: 0 },
    );
    expect(zeroCeiling).toContain('5.2<span class="u">g</span>');
    expect(zeroCeiling).not.toContain("/0 g");
    expect(zeroCeiling).toContain("limit 0 g · 5.2 g over");
});

// ---- no goal, and the goal of 0 that means the same thing ------------------
//
// A strip with no goals is a real state (get_goal_progress, get_trends and
// get_nutrition_summary all send `goals: null`), and it has to SAY so — a bare
// figure beside an empty ring reads as a widget that failed to load. The
// calorie block has exactly one slot for it.
test("with no goals every tile says so, calorie block included", () => {
    const html = macrosApi.macroPanel(VALS, null);
    // `mute` because there is no target to be for or against — the distance
    // left is the one part of the meta line normally worth reading twice, and
    // with no goal there is no distance.
    expect(html).toContain('<b class="fdelta mute">no goal set</b>');
    expect(html).not.toContain("hgoal");
    // …and every chip says it too, in the caption that is now its
    // screen-reader text and the drawer's head. The chips used to opt out of
    // the phone layout's caption hiding for exactly this reason; the captions
    // are hidden from sight at every width now, so the assertion moves to the
    // one place the wording still has to be right.
    const captions = [...html.matchAll(/<span class="dcap">([^<]*)<\/span>/g)];
    // 9, not 8: the calorie hero is a tile now and carries its own caption, so
    // the "calorie block included" in this test's name is literal.
    expect(captions.length).toBe(9); // calories + 3 macros + water + 4 limits
    // toContain, not toBe: alcohol's caption still leads with its drink gloss,
    // which is a reading and not a goal.
    for (const c of captions) expect(c[1]).toContain("no goal set");
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

// ---- the limits -----------------------------------------------------------
//
// One to four chips, no special cases: alcohol simply is or is not among them.
//
// Every chip on the strip, in DOM order, as { role class, visible label }. The
// limits used to be found by container — `split('<div class="rail">')[2]` — and
// macroPanel now emits ONE rail (macros, water, then the limits), so a
// container index would pin nothing at all. The `c-*` role class each chip
// carries is the durable handle: it is what base.css sets --c from, so it
// cannot be dropped without the chip losing its colour. `.*?` is safe across
// the join because chipMarkup emits one chip per line with no newline inside
// it, and lazy matching therefore pairs each class attribute with its OWN .k.
// The calorie hero carries `chip` in its class list DELIBERATELY — it is the
// same component one size up, so it inherits every state rule — and it is not a
// rail item. `\shero\b` is what keeps it out of these counts; matching on the
// bare `chip` class would fold the headline figure into the metric list.
const chips = (html: string) =>
    [
        ...html.matchAll(
            /class="chip(?![^"]*\shero\b)[^"]*\sc-([a-z]+)"[^>]*>.*?<span class="k">([^<]*)<\/span>/g,
        ),
    ].map((m) => ({ color: `c-${m[1]!}`, label: m[2]! }));

// Derived from MACROS, not from a hand-written list of the four: a fifth limit
// added there joins these assertions automatically, and a limit demoted to some
// other role leaves them.
const colorsForRole = (role: string) =>
    new Set(
        macrosApi.MACROS.filter((m) => m.role === role).map((m) => m.color!),
    );
const LIMIT_COLORS = colorsForRole("limit");
const limitChips = (html: string) =>
    chips(html).filter((c) => LIMIT_COLORS.has(c.color));
const limitKeys = (html: string) => limitChips(html).map((c) => c.label);

const railLabels = (html: string) => chips(html).map((c) => c.label);

test("the limits are sugar, alcohol, caffeine, fiber — in that order", () => {
    expect(limitKeys(macrosApi.macroPanel(VALS, GOALS))).toEqual([
        "Sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
});

// Ordering is guaranteed by the ROLE DISPATCH and never by a key list: macros,
// then the bar, then the limits in MACROS order — all in ONE rail.
//
// The limits used to collapse behind a `.more` row to buy height. That is gone:
// a nutrient the user has recorded is one they want to see, and
// "Alcohol · Caffeine · Fiber" behind a chevron read as the card hiding its own
// data. The tile grid pays the height back instead (2 or 4 columns, so eight
// metrics are always a whole rectangle).
test("one rail, every metric, in role order, with the hint in the foot", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    // Exactly one rail, and nothing collapsed behind anything.
    expect(
        [...html.matchAll(/<div class="rail([^"]*)"/g)].map((m) => m[1]),
    ).toEqual([""]);
    expect(html).not.toContain("rail limits");
    expect(html).not.toContain("data-macro-more");
    expect(railLabels(html)).toEqual([
        "Protein",
        "Carbs",
        "Fat",
        "Water",
        "Sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
    // The hint left the rail: it is small print ABOUT the widget, not a reading,
    // so it lives in the card's foot with the bridge's settings note. That foot
    // is also the slot bridge.js appends into, so it must exist and must come
    // after everything the widget measured.
    expect(html).toContain('<div class="foot" data-widget-foot>');
    expect(html).not.toContain("chip ghost");
    expect(html.indexOf("data-macro-hint")).toBeGreaterThan(
        html.indexOf('<div class="drawer"'),
    );
    expect(html.indexOf('<div class="foot"')).toBeGreaterThan(
        html.lastIndexOf('class="k">Fiber'),
    );
});

// A limit still has to EARN its tile — that gate is unchanged by the rail
// merge, and it is what keeps a "0 mg of 400 mg" line off a card belonging to
// someone who has never recorded caffeine (#78).
test("a breach is on the same rail as everything else, never hoisted or hidden", () => {
    // Nothing over a ceiling: all four limits still render, in order.
    const calm = macrosApi.macroPanel({ ...VALS, sugar_g: 31.9 }, GOALS);
    expect(limitKeys(calm)).toEqual(["Sugar", "Alcohol", "Caffeine", "Fiber"]);
    expect(calm).not.toContain("rail limits");
    // Sugar over its 45 g ceiling: same rail, same position, flagged in place.
    const breach = macrosApi.macroPanel(VALS, GOALS);
    expect(limitKeys(breach)).toEqual([
        "Sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
    // `static` rides in the same attribute when no meals are passed, so the
    // handle is the over+role pair rather than the whole class list.
    expect(breach).toContain("over c-sug");
});

test("alcohol tracking off drops its cell; every other limit still gets one", () => {
    const html = macrosApi.macroPanel({ ...VALS, alcohol_g: null }, GOALS);
    expect(limitKeys(html)).toEqual(["Sugar", "Caffeine", "Fiber"]);
    // The TIERED strip too, which is what nutrition-summary actually renders.
    // Same `metricShown` filter builds both, but the tiered path deals the
    // limits into a rail of their own, and "the gate still runs when the
    // layout changed" is exactly the kind of thing that quietly stops being
    // true. A leaked alcohol row is a privacy-shaped bug, not a cosmetic one:
    // the opt-in is the user saying they do not want it on screen.
    const tiered = macrosApi.macroPanel(
        { ...VALS, alcohol_g: null },
        GOALS,
        undefined,
        MEALS,
        { tiers: true },
    );
    expect(tiered).not.toContain("c-alc");
    expect(tiered).not.toContain("Alcohol");
    expect(tiered).toContain("c-caf"); // caffeine has no opt-in, so it stays
    expect(
        macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, { tiers: true }),
    ).toContain("c-alc");
    // The rail wraps, so there is no column count to travel with the markup
    // any more — but the fact the old --lc/--lcw pair encoded still holds:
    // every limit that earns a cell renders as a chip of its own, all four of
    // them when alcohol is tracked, none of them folded away at any width.
    expect(limitChips(html)).toHaveLength(3);
    expect(limitChips(macrosApi.macroPanel(VALS, GOALS))).toHaveLength(4);
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
        const m = /<span class="dcap">([^<]*)<\/span>/.exec(
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
// day's intake is read in litres — in the figure, and (this is the part that
// regressed) in every other rendering of the same number.
// A GLYPH IS THE TILE'S MARK, and the dot is what a widget gets until it is
// moved over. Both branches are pinned because the fallback is the half that
// nothing else would catch: every tiered render would look right while the
// three widgets still on the flat rail quietly lost their dots.
//
// The drawing is named by the MACROS entry ("drumstick"), never by the
// emitter — the same indirection as `color: "c-pro"` — so this asserts the
// wiring, not the shape.
// A RAIL IS AS WIDE AS IT HAS THINGS TO SHOW. The column count used to be a
// constant per tier — four for the limits — so a user who does not track
// alcohol got three tiles and a dead fourth cell, and the hole sat exactly
// where the metric they opted out of used to be. `data-n` is the count the
// grid lays itself out to; chip.css caps it by width, but the number itself can
// only come from the rail.
test("each tiered rail reports how many tiles it has", () => {
    const n = (html: string, cls: string) =>
        new RegExp(`<div class="rail ${cls}" data-n="(\\d+)"`).exec(html)?.[1];

    const full = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, {
        tiers: true,
    });
    expect(n(full, "r-macro")).toBe("3");
    expect(n(full, "r-limit")).toBe("4");
    expect(n(full, "r-water")).toBe("1");

    // Drop alcohol and the limits rail is a three-column rail, not a
    // four-column rail with a gap.
    const noAlc = macrosApi.macroPanel(
        { ...VALS, alcohol_g: null },
        GOALS,
        undefined,
        MEALS,
        { tiers: true },
    );
    expect(n(noAlc, "r-limit")).toBe("3");
    // ...and with caffeine never recorded either, two.
    const neither = macrosApi.macroPanel(
        { ...VALS, alcohol_g: null, caffeine_mg: null },
        GOALS,
        undefined,
        MEALS,
        { tiers: true },
    );
    expect(n(neither, "r-limit")).toBe("2");

    // The untiered rail carries no count: it wraps, and its markup is
    // byte-identical to what every widget still on it has always rendered.
    expect(macrosApi.macroPanel(VALS, GOALS, undefined, MEALS)).toContain(
        '<div class="rail">',
    );
});

test("a tiered tile wears its glyph; an untiered one keeps the dot", () => {
    const tiered = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, {
        tiers: true,
    });
    expect(tiered).toContain('class="gi"');
    expect(tiered).not.toContain('<span class="dot"></span>');

    const flat = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    expect(flat).toContain('<span class="dot"></span>');
    expect(flat).not.toContain('class="gi"');
});

// Every metric the strip can render has a drawing, so no tile falls back to a
// dot on a card where its neighbours are glyphs — the one case that would look
// like a bug rather than like a widget that has not been migrated.
test("every MACROS entry names a glyph, and every glyph exists", () => {
    for (const m of macrosApi.MACROS) {
        expect(m.glyph).toBeTruthy();
        expect(macrosApi.GLYPHS[m.glyph!]).toBeTruthy();
    }
});

test("water reads in litres, and an untracked day has no line at all", () => {
    const html = macrosApi.macroPanel(VALS, GOALS);
    // Static chip, so the goal rides the figure — and it is in litres too.
    expect(html).toContain('2.1<span class="u">/2.5 L</span>');
    // No chip at all for someone who neither logged water nor set a target —
    // c-wat is the role class only the water chip carries, so its absence is
    // the absence of the chip.
    const { water_ml: _drop, ...noWaterGoal } = GOALS;
    expect(
        macrosApi.macroPanel({ ...VALS, water_ml: 0 }, noWaterGoal),
    ).not.toContain("c-wat");
    expect(macrosApi.macroPanel({ ...VALS, water_ml: 0 }, null)).not.toContain(
        "c-wat",
    );
});

// A GOAL IS THE USER SAYING THEY TRACK IT, so a 0 against one is a reading and
// not an absence — the same rule fiber and sugar have always had (signal:
// "data"). Water was gated on `> 0` alone, in a test inlined in macroPanel
// rather than asked of metricShown, so the one person whose water goal was the
// whole point of the card — set a 2.5 L target, has not drunk anything yet —
// was the one person shown no water at all, while their equally untouched fiber
// goal still earned a tile.
test("water with a goal and nothing drunk yet still shows, against its goal", () => {
    // chartKeys only so chipHtml can find the tile by data-macro — a static
    // water tile prints the identical figure, as the litres test above pins.
    const html = macrosApi.macroPanel(
        { ...VALS, water_ml: 0 },
        GOALS,
        undefined,
        undefined,
        { chartKeys: ["water_ml"] },
    );
    expect(html).toContain("c-wat");
    // The figure, not the words: "none logged" is the LIMIT idiom for a
    // recorded zero, and it would hide the goal that earned the row.
    expect(chipHtml(html, "water_ml")).toContain(
        '0.0<span class="u">/2.5 L</span>',
    );
    expect(chipHtml(html, "water_ml")).not.toContain("none logged");
});

// ONE metric, ONE unit. The chip said "2.1 L" while its caption said "of
// 2,500 ml · 400 ml left", its accessible name said "Water 2,100 ml" and the
// chart foot under it said "avg 2,100 ml" — three units on screen at once, and
// a WCAG 2.5.3 label-in-name failure since the visible label was not contained
// in the accessible name (regression audit). `display` on the MACROS entry is
// the single place that decides it now.
test("water is litres in the chip, in its caption and in its accessible name", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, undefined, {
        chartKeys: ["water_ml"],
    });
    expect(chipHtml(html, "water_ml")).toContain(
        '2.1<span class="u">/2.5 L</span>',
    );
    expect(html).toContain('<span class="dcap">of 2.5 L · 0.4 L left</span>');
    expect(tileLabels(html).water_ml).toBe(
        `Water 2.1/2.5 L, 0.4 L left. ${WIDGET_STRINGS_EN.macros.showOnChart}`,
    );
    // Not one millilitre figure anywhere — not in the chip, not in the caption
    // and not in the name. (Caffeine's own "400 mg" is why this is scoped to
    // the water figures rather than to the substring " ml".)
    expect(html).not.toContain("2,100");
    expect(html).not.toContain("2,500");
    expect(chipHtml(html, "water_ml")).not.toContain("ml<");
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
    expect(line("caffeine_mg", 0, 0)).toBe("limit 0 mg");
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
    // The TIERED strip too — same reason as alcohol's: one `metricShown`
    // decides both, but the tiered path deals the limits into a rail of their
    // own, and this gate is the whole of issue #78. Unlike alcohol's, this one
    // guards a DATA state rather than a preference: there is deliberately no
    // caffeine_tracking_enabled anywhere on the tool surface (pinned in
    // src/mcp.test.ts), so a null means nobody ever logged any — the ordinary
    // state for most accounts, not an opt-out.
    const tiered = macrosApi.macroPanel(
        { ...VALS, caffeine_mg: null },
        GOALS,
        undefined,
        MEALS,
        { tiers: true },
    );
    expect(tiered).not.toContain("c-caf");
    expect(tiered).not.toContain("Caffeine");
    // ...while the metrics either side of it on that rail are untouched.
    expect(tiered).toContain("c-sug");
    expect(tiered).toContain("c-fib");
    expect(
        macrosApi.macroPanel(VALS, GOALS, undefined, MEALS, { tiers: true }),
    ).toContain("c-caf");
});

test("caffeine is milligrams alone — the drink gloss is alcohol's only", () => {
    const html = caffeineCell({ caffeine_mg: 185 }, GOALS);
    // The unit now always rides the figure: the caption that used to carry it
    // is visually hidden (it is the chip's screen-reader text and the drawer's
    // head), and "185" alone in a rail of mixed units is unreadable.
    // A static chip prints its goal beside the figure (see the static-tile
    // test); what this pins is that the unit is milligrams and rides the value
    // rather than living only in the visually hidden caption.
    expect(html).toContain(
        '<span class="v">185<span class="u">/400 mg</span></span>',
    );
    expect(html).toContain("limit 400 mg");
    expect(caffeineCell({ caffeine_mg: 185 }, null)).toContain(
        '185<span class="u">mg</span>',
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
    // limitKeys filters the rail by the role classes of the MACROS entries
    // whose role is "limit", so finding Caffeine among them is proof the chip
    // was built by the limit branch and not as one of the macro chips.
    expect(limitKeys(html)).toContain("Caffeine");
    expect(chips(html).find((c) => c.label === "Caffeine")?.color).toBe(
        "c-caf",
    );
    expect(colorsForRole("macro").has("c-caf")).toBe(false);
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

// ---------------------------------------------------------------------------
// The two INTERACTIONS a string assertion cannot reach: what a tap does to the
// hint line, and where focus lands when one disclosure closes because another
// opened. Both were measured as broken in a live widget by the recheck round,
// so both are pinned here rather than left to the next browser pass.
//
// A ~90-line stand-in DOM instead of a dependency: macroToggle
// touch six DOM affordances between them (closest, querySelector(All),
// dataset, get/setAttribute, focus, contains) plus the ONE browser behaviour
// that causes the bug — hiding an element that contains document.activeElement
// drops focus on <body>. That last one is modelled deliberately: without it
// these tests would pass with the fix removed.
type FakeDoc = {
    activeElement: FakeEl | null;
    body: FakeEl;
    getElementById(id: string): FakeEl | null;
    querySelector(sel: string): FakeEl | null;
    addEventListener(type: string, fn: (e: unknown) => void): void;
};
let __doc: FakeDoc;
// The partial's delegated handlers, captured as it registers them so a test
// can dispatch a key to the real Escape handler rather than to a copy of it.
const __listeners: Record<string, Array<(e: unknown) => void>> = {};

class FakeEl {
    attrs: Record<string, string> = {};
    dataset: Record<string, string> = {};
    children: FakeEl[] = [];
    parent: FakeEl | null = null;
    innerHTML = "";
    #hidden = false;
    constructor(
        public tag: string,
        attrs: Record<string, string> = {},
    ) {
        for (const [k, v] of Object.entries(attrs)) this.setAttribute(k, v);
    }
    // THE BROWSER BEHAVIOUR UNDER TEST. `hidden` on an ancestor of the focused
    // element makes the browser blur it to <body> — which is exactly how a
    // keyboard user gets returned to the top of the tab ring by a disclosure
    // closing under them.
    get hidden() {
        return this.#hidden;
    }
    set hidden(v: boolean) {
        this.#hidden = v;
        if (v && __doc.activeElement && this.contains(__doc.activeElement)) {
            __doc.activeElement = __doc.body;
        }
    }
    add(...kids: FakeEl[]) {
        for (const k of kids) {
            k.parent = this;
            this.children.push(k);
        }
        return this;
    }
    setAttribute(k: string, v: string) {
        this.attrs[k] = v;
        if (k.startsWith("data-")) {
            const name = k.slice(5).replace(/-(.)/g, (_, c) => c.toUpperCase());
            this.dataset[name] = v;
        }
    }
    removeAttribute(k: string) {
        delete this.attrs[k];
        if (k.startsWith("data-")) {
            const name = k.slice(5).replace(/-(.)/g, (_, c) => c.toUpperCase());
            delete this.dataset[name];
        }
    }
    get tagName() {
        return this.tag.toUpperCase();
    }
    getAttribute(k: string) {
        return k in this.attrs ? this.attrs[k]! : null;
    }
    hasAttribute(k: string) {
        return k in this.attrs;
    }
    focus() {
        __doc.activeElement = this;
    }
    contains(el: FakeEl | null) {
        for (let n = el; n; n = n.parent) if (n === this) return true;
        return false;
    }
    closest(sel: string): FakeEl | null {
        for (let n: FakeEl | null = this; n; n = n.parent)
            if (n.matches(sel)) return n;
        return null;
    }
    matches(sel: string): boolean {
        return sel.split(",").some((part) => {
            const tokens = part.trim().match(/\.[\w-]+|\[[^\]]+\]/g) || [];
            return tokens.every((t) => {
                if (t[0] === ".")
                    return (this.attrs.class || "")
                        .split(" ")
                        .includes(t.slice(1));
                const m = t.slice(1, -1).split("=");
                const k = m[0]!;
                return m.length === 1
                    ? this.hasAttribute(k)
                    : this.getAttribute(k) === m[1]!.replace(/"/g, "");
            });
        });
    }
    #walk(out: FakeEl[]) {
        for (const c of this.children) {
            out.push(c);
            c.#walk(out);
        }
        return out;
    }
    querySelectorAll(sel: string) {
        return this.#walk([]).filter((e) => e.matches(sel));
    }
    querySelector(sel: string) {
        return this.querySelectorAll(sel)[0] || null;
    }
}

// A second evaluation of the partial, this one WITH a document — the one at the
// top of this file deliberately has none, so that its delegated wiring stays
// out of the way of the markup assertions. Kept separate rather than merged so
// that rule survives.
const domApi = await (async () => {
    const body = new FakeEl("body");
    __doc = {
        activeElement: body,
        body,
        getElementById: (id: string) =>
            body.querySelector(`[id="${id}"]`) as FakeEl | null,
        querySelector: (sel: string) => body.querySelector(sel),
        addEventListener: (type: string, fn: (e: unknown) => void) => {
            (__listeners[type] ||= []).push(fn);
        },
    };
    const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
    const iconSrc = await Bun.file(`${SRC}/shared/icon.js`).text();
    const macrosSrc = await Bun.file(`${SRC}/shared/macros.js`).text();
    const factory = new Function(
        "fmt",
        "esc",
        "WIDGET_STRINGS",
        "document",
        "window",
        `${i18nSrc}\n${iconSrc}\n${macrosSrc}\nreturn { macroPanel, macroToggle, macroCloseDrawer, focusApply, macroReturn, macroCtx };`,
    );
    return factory(fmt, esc, { en: WIDGET_STRINGS_EN }, __doc, {}) as {
        macroPanel: (
            vals: Vals,
            goal?: Vals | null,
            wording?: unknown,
            meals?: unknown[],
            opts?: {
                chartKeys?: string[];
                onSeries?: (key: string, opened: boolean) => void;
            },
        ) => string;
        macroToggle: (cell: FakeEl) => void;
        macroCloseDrawer: (panel: FakeEl | null) => boolean;
        focusApply: (
            fx: FakeEl,
            m: Macro,
            ctx: unknown,
            selected?: boolean,
        ) => void;
        macroReturn: (fx: FakeEl) => void;
        macroCtx: () => unknown;
    };
})();

// The strip macroToggle reads its ctx from, plus a hand-built DOM of the same
// shape. `id` is set on the elements the partial looks up by id.
function buildStrip(
    chartKeys: string[],
    onSeries?: (key: string, opened: boolean) => void,
) {
    __doc.body.children = [];
    domApi.macroPanel(VALS, GOALS, undefined, MEALS, { chartKeys, onSeries });
    const chip = (key: string, state: "aria-expanded" | "aria-pressed") =>
        new FakeEl("button", { "data-macro": key, [state]: "false" });
    const protein = chip("protein_g", "aria-expanded");
    const water = chip("water_ml", "aria-pressed");
    const fiber = chip("fiber_g", "aria-expanded");
    const hint = new FakeEl("span", { "data-macro-hint": "" });
    const drawer = new FakeEl("div", { class: "drawer", id: "macro-drawer" });
    drawer.hidden = true;
    const more = new FakeEl("button", {
        "data-macro-more": "",
        "aria-expanded": "false",
    });
    const limits = new FakeEl("div", {
        class: "rail limits",
        id: "macro-limits",
    });
    limits.hidden = true;
    const panel = new FakeEl("div", { "data-macro-panel": "" });
    panel.add(protein, water, hint, more, limits.add(fiber), drawer);
    __doc.body.add(panel);
    return { panel, protein, water, fiber, hint, drawer, more, limits };
}

// THE HINT IS THE INSTRUCTION, and it may only be replaced by the answer. The
// rewrite hid it on `open` alone, so tapping Water — a chart-series selector
// with no breakdown behind it — deleted "Tap a metric for the meals behind it"
// while nothing at all opened (regression recheck measured it live on
// nutrition-summary). Losing the only affordance hint on a phone, where there
// is no hover and no cursor, is exactly what that line exists to prevent.
test("only a drawer actually opening hides the tap hint", () => {
    const d = buildStrip(["water_ml", "protein_g"]);
    expect(d.hint.hidden).toBe(false);

    // A chart-only chip: it presses, it re-strokes the chart, it opens nothing.
    domApi.macroToggle(d.water);
    expect(d.water.getAttribute("aria-pressed")).toBe("true");
    expect(d.drawer.hidden).toBe(true);
    expect(d.hint.hidden).toBe(false);

    // A disclosure chip: the answer is on screen, so the instruction goes.
    domApi.macroToggle(d.protein);
    expect(d.drawer.hidden).toBe(false);
    expect(d.hint.hidden).toBe(true);

    // …and comes back when the answer does not need the room any more.
    domApi.macroToggle(d.protein);
    expect(d.drawer.hidden).toBe(true);
    expect(d.hint.hidden).toBe(false);
});

// A disclosure hands focus BOTH ways — into the region on open, back to a
// trigger on close — and "close" includes being closed by something else. The
// ✕ path already kept that contract; the two cross-closes did not, and left
// document.activeElement on <body>.
test("a cross-close hands focus to a trigger, never to <body>", () => {
    const d = buildStrip(["water_ml", "protein_g"]);

    // Open the breakdown: focus moves into the drawer, as designed.
    domApi.macroToggle(d.protein);
    expect(__doc.activeElement).toBe(d.drawer);
    // Now a chart-only chip takes the floor. The drawer it closes is holding
    // focus, so the chip the user just activated has to take it.
    domApi.macroToggle(d.water);
    expect(d.drawer.hidden).toBe(true);
    expect(__doc.activeElement).toBe(d.water);

    // And back the other way, so the contract is not one-directional: the
    // chart-only chip's own drawer-less close hands focus on to whichever
    // trigger takes the floor next.
    domApi.macroToggle(d.protein);
    expect(d.drawer.hidden).toBe(false);
    expect(__doc.activeElement).toBe(d.drawer);
    domApi.macroToggle(d.protein);
    expect(d.drawer.hidden).toBe(true);
    expect(__doc.activeElement).toBe(d.protein);
});

// ---- one decision per rendered thing ---------------------------------------
//
// The bug class this file's partial keeps producing: a rule implemented in the
// CALLER rather than in the thing that renders, so a second caller silently
// gets a different answer. Three of these were live at once — the words a
// zero-limit reads in, the predicate for "breached", and the colour role class
// on a drawer row — and each one put two renderings of one metric on screen at
// the same moment.

// macroLimit decided the words; tileLabel re-derived them on `signal: "null"`
// alone; focusInner asked nobody. So a sugar tile SHOWED "none logged" and
// ANNOUNCED "Sugar 0 g" (a WCAG 2.5.3 label-in-name failure), and the focus
// panel — focusInner is its only caller — printed "0/45 g" directly above that
// tile. macroReadsAsNone is now the single answer for all three.
test("a recorded-zero limit reads in words wherever it is rendered", () => {
    const zeroed = {
        ...VALS,
        sugar_g: 0,
        fiber_g: 0,
        alcohol_g: 0,
        caffeine_mg: 0,
    };
    const html = macrosApi.macroPanel(zeroed, GOALS, undefined, MEALS);
    const labels = tileLabels(html);
    for (const key of ["sugar_g", "fiber_g"]) {
        // The tile is a button here (a meal contributed to it in MEALS), so
        // its accessible name stands in for its children — and has to contain
        // the words the tile actually shows.
        expect(labels[key]).toContain("none logged");
        expect(labels[key]).not.toContain(" 0 g,");
    }
    // The panel, through its own renderer, agrees with the tile.
    const ctx = macrosApi.macroCtxOf(zeroed, GOALS, undefined, MEALS);
    for (const key of ["sugar_g", "alcohol_g", "caffeine_mg", "fiber_g"]) {
        const panel = macrosApi.focusInner(macroOf(key), ctx);
        expect(panel).toContain('<span class="none">none logged</span>');
        expect(panel).not.toContain('<span class="u">/');
    }
    // A macro's zero is NOT a limit's zero: it is a measurement of the day and
    // still reads as one. Narrowing this the other way is the regression to
    // watch for.
    const noProtein = macrosApi.macroPanel(
        { ...VALS, protein_g: 0 },
        GOALS,
        undefined,
        MEALS,
    );
    expect(noProtein).toContain('0<span class="u">/160 g</span>');
    expect(tileLabels(noProtein).protein_g).toContain("Protein 0/160 g,");
});

// ---- the printed figures decide the state ----------------------------------
//
// macroBits used to judge on the raw payload and then PRINT rounded, so the
// verdict and the digits beside it disagreed: protein 159.6 of 160 read
// "160/160 g · 0 g left", water 2,480 of 2,500 ml "2.5/2.5 L · 0.0 L left",
// and sugar 45.04 of 45 turned red with "45/45 g · 0 g over".
test("every state is read off the figures as printed", () => {
    type B = Bits & { atGoal: boolean; atLimit: boolean; frac: number };
    const bits = (key: string, v: number, t: number) =>
        macrosApi.macroBits(macroOf(key), { [key]: v }, { [key]: t }) as B;

    // Equal on screen, on a floor: at goal — never "0 g left".
    expect(line("protein_g", 159.6, 160)).toBe("of 160 g · at goal");
    expect(bits("protein_g", 159.6, 160).atGoal).toBe(true);
    expect(line("protein_g", 160.4, 160)).toBe("of 160 g · at goal");
    // Water on its DISPLAY step — tenths of a litre, not millilitres.
    expect(line("water_ml", 2480, 2500)).toBe("of 2.5 L · at goal");
    expect(line("calories", 2199.6, 2200)).toBe("of 2,200 kcal · at goal");

    // Equal on screen, on a ceiling: at limit, and never red.
    const sugar = bits("sugar_g", 45.04, 45);
    expect(sugar.goalLine).toBe("limit 45 g · at limit");
    expect(sugar.over).toBe(false);
    expect(sugar.atLimit).toBe(true);
    const html = macrosApi.macroPanel({ ...VALS, sugar_g: 45.04 }, GOALS);
    expect(html).not.toContain("over c-sug");
    expect(html).toContain('45<span class="u">/45 g</span>');
    // One printed step past is over, and says by how much.
    expect(line("sugar_g", 45.06, 45)).toBe("limit 45 g · 0.1 g over");
    expect(bits("sugar_g", 45.06, 45).over).toBe(true);

    // The figure is printed from the same snapped value the state used…
    expect(
        macrosApi.macroPanel({ ...VALS, protein_g: 159.6 }, GOALS),
    ).toContain('160<span class="u">/160 g</span>');
    // …while the fill stays raw: a sliver of fill is not a verdict.
    expect(bits("protein_g", 159.6, 160).frac).toBeCloseTo(0.9975, 4);

    // Nowhere does a zero distance survive.
    const cases: Array<[string, number, number]> = [
        ["protein_g", 159.6, 160],
        ["water_ml", 2480, 2500],
        ["water_ml", 2520, 2500],
        ["sugar_g", 45.04, 45],
        ["caffeine_mg", 400.3, 400],
        ["calories", 2200.4, 2200],
    ];
    for (const [k, v, t] of cases) {
        expect(line(k, v, t)).not.toMatch(
            /(^|\s)0([.,]0)? \S+ (left|over|under)/,
        );
    }
});

// A key simply absent from `vals` is not a measured zero. `?? 0` printed
// "0/160 g · 160 g left" for a metric nobody had measured.
test("a missing reading reads as none logged, with no distance", () => {
    const { protein_g: _drop, ...noProtein } = VALS;
    const b = macrosApi.macroBits(
        macroOf("protein_g"),
        noProtein,
        GOALS,
    ) as Bits & { deltaStr: string };
    expect(b.goalLine).toBe("of 160 g");
    expect(b.deltaStr).toBe("");
    const html = macrosApi.macroPanel(noProtein, GOALS, undefined, MEALS);
    expect(chipHtml(html, "protein_g")).toContain(
        '<span class="none">none logged</span>',
    );
    expect(chipHtml(html, "protein_g")).not.toContain("left");
    expect(tileLabels(html).protein_g).toBe(
        "Protein none logged, of 160 g. Show the meals that contributed.",
    );
    // null means the same thing as absent.
    expect(
        macrosApi.macroBits(macroOf("fat_g"), { fat_g: null } as never, GOALS)
            .goalLine,
    ).toBe("of 70 g");
    // …and the panel, through its own renderer, agrees — with no ring.
    const panel = macrosApi.focusInner(
        macroOf("protein_g"),
        macrosApi.macroCtxOf(noProtein, GOALS, undefined, MEALS),
    );
    expect(panel).toContain('<span class="none">none logged</span>');
    expect(panel).not.toContain('class="fring"');
});

// The ring IS the fraction. With no goal there is no fraction, and an empty
// track read as "0% done" beside a figure that is nothing of the kind.
test("no goal, no ring", () => {
    const cal = macroOf("calories");
    expect(
        macrosApi.focusInner(cal, macrosApi.macroCtxOf(VALS, GOALS)),
    ).toContain('class="fring"');
    const none = macrosApi.focusInner(cal, macrosApi.macroCtxOf(VALS, null));
    expect(none).not.toContain('class="fring"');
    expect(none).toContain('<b class="fdelta mute">no goal set</b>');
    // A ceiling of 0 IS a goal, so it keeps its (empty) ring.
    expect(
        macrosApi.focusInner(
            macroOf("alcohol_g"),
            macrosApi.macroCtxOf({ alcohol_g: 0 }, { alcohol_g: 0 }),
        ),
    ).toContain('class="fring"');
});

// Focus lands on the drawer, so it has to be something with a name: as a bare
// div a screen reader read the whole breakdown as one unlabelled run.
test("the drawer is a region named by its head", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    expect(html).toContain(
        '<div class="drawer" id="macro-drawer" role="region" aria-labelledby="macro-drawer-name" tabindex="-1" hidden>',
    );
    const body = macrosApi.macroDetailBody(
        macroOf("protein_g"),
        macrosApi.macroCtxOf(VALS, GOALS, undefined, MEALS),
    );
    expect(body).toContain(
        '<b class="dname" id="macro-drawer-name">Protein</b>',
    );
});

// focusOver counts a breached CALORIE goal (calories declares no `direction`,
// but a calorie goal is read as a ceiling by everyone who sets one);
// macroDetailBody used the tiles' ceiling-only rule instead. One metric, one
// instant, two colours: a red ring, hairline, sparkline and delta in the panel,
// over a drawer whose dot was calorie orange and whose "1,000 kcal over" sat in
// the quietest ink on the card. Only the panel can open the calorie drawer, so
// the drawer must agree with whatever opened it.
test("the drawer head flags a breached calorie goal, exactly as the panel does", () => {
    const over = { ...VALS, calories: 3200 };
    const bits = macrosApi.macroBits(macroOf("calories"), over, GOALS);
    expect(macrosApi.focusOver(macroOf("calories"), bits)).toBe(true);
    const body = macrosApi.macroDetailBody(
        macroOf("calories"),
        macrosApi.macroCtxOf(over, GOALS, undefined, MEALS),
    );
    expect(body).toContain('<div class="dhead c-cal over">');
    expect(body).toContain('<span class="dcap over">');
    expect(body).toContain("1,000 kcal over");
    // A floor merely exceeded still flags on neither surface.
    const fat = macrosApi.macroBits(macroOf("fat_g"), { fat_g: 91 }, GOALS);
    expect(macrosApi.focusOver(macroOf("fat_g"), fat)).toBe(false);
});

// THE ROLE CLASS BELONGS ON THE CONTAINER. On each `<li>` it was outside the
// `.dhead.over` that reassigns --c, so a breached metric's head resolved --c to
// --over while every row under it resolved the raw series token — the same
// shape as the drawer-dot and sparkline-wrapper bugs already fixed. Nothing in
// a row paints from --c today, which is exactly why nothing would catch it.
test("a drawer's colour rides the list, not each row", () => {
    const meals = [{ description: "Overnight oats", sugar_g: 24.6 }];
    const list = macrosApi.mealList(macroOf("sugar_g"), meals, " over");
    expect(list).toContain('<ul class="dlist c-sug over">');
    expect(list).not.toContain("<li class=");
    // …and the flag really comes from the head's own predicate.
    const body = macrosApi.macroDetailBody(
        macroOf("sugar_g"),
        macrosApi.macroCtxOf(
            { ...VALS, sugar_g: 58.2 },
            GOALS,
            undefined,
            meals,
        ),
    );
    expect(body).toContain('<div class="dhead c-sug over">');
    expect(body).toContain('<ul class="dlist c-sug over">');
});

// The card header spells a calendar day out ("5–7 Jul", month names translated,
// a year exactly where it matters); the drawer three lines below printed an ISO
// slice, "07-05" — which most of the nine locales read as 7 May, and which
// drops the year in precisely the year-crossing range the header exists to
// disambiguate.
test("a drawer row names its day the way the card header does", () => {
    const list = macrosApi.mealList(macroOf("sugar_g"), [
        { description: "Overnight oats", date: "2026-07-05", sugar_g: 24.6 },
    ]);
    expect(list).toContain('<span class="ds">5 Jul</span>');
    expect(list).not.toContain("07-05");
    // A row with no date still falls back to its meal type, untouched.
    expect(
        macrosApi.mealList(macroOf("sugar_g"), [
            {
                description: "Overnight oats",
                meal_type: "breakfast",
                sugar_g: 1,
            },
        ]),
    ).toContain('<span class="ds">breakfast</span>');
});

// ONE SEPARATOR PER CARD. macroNum's `display` branch and the drink gloss both
// went through toFixed (always a dot) while everything else went through fmt
// (the HOST BROWSER's locale, never the widget's), so a German card printed
// "Zucker 58,2/45 g" beside "Wasser 2.1/2.5 L".
test("figures are formatted in the widget's locale, not the host's", () => {
    expect(macrosApi.macroDecimal(2.1, 1)).toBe("2.1");
    try {
        macrosApi.setLocale("de");
        expect(macrosApi.macroDecimal(2.1, 1)).toBe("2,1");
        // The two paths that used to hard-code a dot: water's litre conversion
        // and alcohol's drink count.
        expect(
            macrosApi.macroLimit(
                macroOf("alcohol_g"),
                macrosApi.macroCtxOf({ alcohol_g: 12.5 }, GOALS),
            ),
        ).toContain("0,9 US drinks");
        expect(
            macrosApi.macroPanel({ ...VALS, water_ml: 2100 }, GOALS),
        ).toContain("2,1");
    } finally {
        macrosApi.setLocale("en");
    }
    expect(macrosApi.macroDecimal(2.1, 1)).toBe("2.1");
});

// The meta line is one ellipsised row and an ellipsis eats what comes LAST —
// which was `.fdelta`, the distance left. Measured at 320px: present in en and
// ja (whose calorie label happens to be short), absent in de/es/fr/it/uk, same
// card and same data. Three elements is what lets chip.css floor the figure and
// shrink only the prose, so collapsing them back is the regression.
test("the panel's meta line keeps the label and the delta separable", () => {
    const html = macrosApi.macroPanel(VALS, GOALS, undefined, MEALS);
    expect(html).toContain('<span class="flabel">');
    expect(html).toContain('<span class="fsep">·</span>');
    expect(html).toContain('<b class="fdelta">165 kcal left</b>');
});

// TWO CONTROLS, ONE METRIC. nutrition-summary re-points its focus panel at
// whatever tile is selected (focusApply), so after any tap the panel AND that
// tile both carry `data-macro="<key>"` — and the panel is first in document
// order. Two shipped consequences: the state loop marked only the tapped
// element, so the a11y tree carried two identically-named buttons disagreeing
// about whether the region was open; and the ✕ resolved its trigger with
// `querySelector`, found the panel, read its stale "false", and RE-RENDERED the
// drawer it was asked to close while de-selecting the tile that owned it.
test("a mirrored control and its tile share one state, and the ✕ closes through the opener", () => {
    const d = buildStrip(["protein_g"]);
    // The mirror, first in document order — the ordering is the bug, so it is
    // part of the fixture rather than incidental.
    const mirror = new FakeEl("button", {
        "data-macro": "protein_g",
        "aria-expanded": "false",
    });
    mirror.parent = d.panel;
    d.panel.children.unshift(mirror);
    expect(d.panel.querySelector('[data-macro="protein_g"]')).toBe(mirror);

    domApi.macroToggle(d.protein);
    expect(d.drawer.hidden).toBe(false);
    // Both controls report the state they are visibly in.
    expect(d.protein.getAttribute("aria-expanded")).toBe("true");
    expect(mirror.getAttribute("aria-expanded")).toBe("true");
    // …and nothing else on the strip is dragged along with them.
    expect(d.water.getAttribute("aria-pressed")).toBe("false");
    expect(d.fiber.getAttribute("aria-expanded")).toBe("false");

    // The ✕ closes, and hands focus back to the element that actually opened
    // the drawer — not to whichever one querySelector reaches first.
    expect(domApi.macroCloseDrawer(d.panel)).toBe(true);
    expect(d.drawer.hidden).toBe(true);
    expect(d.drawer.dataset.open).toBe("");
    expect(__doc.activeElement).toBe(d.protein);
    expect(d.protein.getAttribute("aria-expanded")).toBe("false");
    expect(mirror.getAttribute("aria-expanded")).toBe("false");
    expect(d.hint.hidden).toBe(false);

    // Opened FROM the mirror, the ✕ comes back to the mirror.
    domApi.macroToggle(mirror);
    expect(d.drawer.hidden).toBe(false);
    expect(domApi.macroCloseDrawer(d.panel)).toBe(true);
    expect(__doc.activeElement).toBe(mirror);
    // Nothing open: the close path is a no-op rather than a re-open.
    expect(domApi.macroCloseDrawer(d.panel)).toBe(false);
    expect(d.drawer.hidden).toBe(true);
});

// The real Escape handler, dispatched through the listener the partial
// registered. Returns whether it claimed the key (preventDefault).
function pressEscape(target: FakeEl): boolean {
    let prevented = false;
    for (const fn of __listeners.keydown || []) {
        fn({
            key: "Escape",
            target,
            preventDefault: () => {
                prevented = true;
            },
        });
    }
    return prevented;
}

// A chart-only toggle opens no drawer, so an Escape that only knew how to
// close drawers left it pressed — the one selection with no keyboard exit
// but a second activation.
test("Escape closes a drawer first, then releases a pressed chart toggle, else stays the host's", () => {
    const d = buildStrip(["water_ml", "protein_g"]);

    domApi.macroToggle(d.water);
    expect(d.water.getAttribute("aria-pressed")).toBe("true");
    expect(pressEscape(d.water)).toBe(true);
    expect(d.water.getAttribute("aria-pressed")).toBe("false");
    // Nothing selected any more: the key is left to the host.
    expect(pressEscape(d.water)).toBe(false);

    // A drawer still closes through its opener, focus going back to it.
    domApi.macroToggle(d.protein);
    expect(__doc.activeElement).toBe(d.drawer);
    expect(pressEscape(d.drawer)).toBe(true);
    expect(d.drawer.hidden).toBe(true);
    expect(__doc.activeElement).toBe(d.protein);
    expect(d.protein.getAttribute("aria-expanded")).toBe("false");
});

// THE MIRROR IS NOT A SECOND COPY OF THE TILE. focusApply used to hand the
// panel the open tile's whole identity — name, aria-expanded, aria-controls —
// so the a11y tree read two identical "Protein …, expanded" buttons in a row,
// and the calorie drawer had no control at all until the tile closed.
test("a panel mirroring an open tile is a single return-to-calories control", () => {
    const cal = macroOf("calories");
    let fx: FakeEl;
    // What nutrition-summary's onSeries does: mirror the selected metric,
    // calories when released.
    const onSeries = (key: string, opened: boolean) =>
        domApi.focusApply(
            fx,
            opened ? macroOf(key) : cal,
            domApi.macroCtx(),
            opened,
        );
    const d = buildStrip(["protein_g", "water_ml"], onSeries);
    fx = new FakeEl("button", { class: "focus c-cal" });
    fx.parent = d.panel;
    d.panel.children.unshift(fx);
    domApi.focusApply(fx, cal, domApi.macroCtx(), false);
    // Resting: the panel is the calorie disclosure.
    expect(fx.getAttribute("data-macro")).toBe("calories");
    expect(fx.getAttribute("aria-expanded")).toBe("false");

    domApi.macroToggle(d.protein);
    // Exactly one control for protein, and it is the tile.
    expect(d.panel.querySelectorAll('[data-macro="protein_g"]')).toEqual([
        d.protein,
    ]);
    expect(fx.hasAttribute("data-macro")).toBe(false);
    expect(fx.hasAttribute("aria-expanded")).toBe(false);
    expect(fx.hasAttribute("aria-controls")).toBe(false);
    expect(fx.hasAttribute("aria-pressed")).toBe(false);
    expect(fx.hasAttribute("data-macro-return")).toBe(true);
    // Says what it shows — the tile's own figure, verbatim — and what it does.
    expect(fx.getAttribute("aria-label")).toBe(
        "Showing Protein 148/160 g, 12 g left. Back to calories.",
    );
    // A ✕ where the disclosure chevron was: it closes, it does not open.
    expect(fx.innerHTML).toContain('<span class="chev"><svg');
    expect(fx.innerHTML).toContain("M4.5 4.5l7 7");

    // Activating it returns the card to calories THROUGH the tile.
    fx.focus();
    domApi.macroReturn(fx);
    expect(d.drawer.hidden).toBe(true);
    expect(d.protein.getAttribute("aria-expanded")).toBe("false");
    expect(fx.getAttribute("data-macro")).toBe("calories");
    expect(fx.getAttribute("aria-expanded")).toBe("false");
    expect(fx.hasAttribute("data-macro-return")).toBe(false);
    // Focus stays where the user put it — the same element throughout.
    expect(__doc.activeElement).toBe(fx);
    expect(d.hint.hidden).toBe(false);

    // A chart-only toggle mirrors the same way, and releases the same way.
    domApi.macroToggle(d.water);
    expect(fx.hasAttribute("data-macro-return")).toBe(true);
    expect(fx.getAttribute("aria-label")).toBe(
        "Showing Water 2.1/2.5 L, 0.4 L left. Back to calories.",
    );
    domApi.macroReturn(fx);
    expect(d.water.getAttribute("aria-pressed")).toBe("false");
    expect(fx.getAttribute("data-macro")).toBe("calories");
});
