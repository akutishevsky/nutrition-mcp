// Behaviour tests for the shared macro-panel partial and for the import
// widget's alcohol gate.
//
// Widget code is inline template JS, so it has no import surface: `macros.js` is
// evaluated here the way the assembler splices it into a page — with the fmt/esc
// helpers each template supplies — and the caption strings are asserted against
// real values. Without this the wording is pinned by nothing at all.
import { test, expect } from "bun:test";
import { WIDGET_STRINGS, WIDGET_STRINGS_EN } from "../../src/copy/widgets";
import { NO_META_CASES, NO_META_GOLDEN } from "./macros.golden";

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
type AddedSugar = {
    v: 1;
    goal: number | null;
    days?: Record<string, number | null>;
    meals?: Record<string, number | null>;
    contributors?: number;
    extra?: unknown;
};
type ExtraRows = Record<string, unknown[]> | null;
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
        `${i18nSrc}\n${macrosSrc}\nreturn { macroBits, MACROS, macroPanel, macroLimit, macroCtxOf, dayHasData, mealList, addedSugarPayload, addedSugarFor, withAddedSugar, withAddedSugarContributors };`,
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
            opts?: {
                drinkUnit?: string;
                bounded?: boolean;
                contributors?: Record<string, number | null> | null;
                mealTotal?: number | null;
                extraRows?: ExtraRows;
            },
        ) => string;
        macroLimit: (m: Macro, ctx: unknown, interactive?: boolean) => string;
        macroCtxOf: (
            vals: Vals,
            goal?: Vals | null,
            wording?: unknown,
            meals?: unknown[],
            opts?: {
                drinkUnit?: string;
                bounded?: boolean;
                contributors?: Record<string, number | null> | null;
                mealTotal?: number | null;
                extraRows?: ExtraRows;
            },
        ) => unknown;
        dayHasData: (day: Vals) => boolean;
        mealList: (m: Macro, meals: unknown[], ctx?: unknown) => string;
        addedSugarPayload: (raw: unknown) => AddedSugar | null;
        addedSugarFor: (
            as: AddedSugar | null,
            dates: string[],
        ) => number | undefined;
        withAddedSugar: (
            as: AddedSugar | null,
            value: number | undefined,
            vals: Vals,
            goal: Vals | null,
            meals: unknown[] | null,
        ) => {
            vals: Vals;
            goal: Vals | null;
            meals: unknown[] | null;
            extraRows: ExtraRows;
        };
        withAddedSugarContributors: (
            as: AddedSugar | null,
            contributors: Record<string, number | null> | null,
        ) => Record<string, number | null> | null;
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

// The same meals with added sugar merged in, as withAddedSugar does from
// `_meta`: the porridge's maple syrup, nothing added to the flat white.
const MEALS_ADDED = [
    { ...MEALS[0], added_sugar_g: 6.2 },
    { ...MEALS[1], added_sugar_g: 0 },
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

// The "N more" line under a capped (8-row) breakdown. nutrition-summary's
// meals are trimmed server-side to each metric's top 8, so its true counts
// travel in the tool result's `_meta`; when a host drops that, the rows past 8
// are only those some other metric kept, and the line must not state a number
// it cannot know. Every other caller's rows are complete and exact.
test("the breakdown's 'N more' line is exact when it can be and a lower bound when not", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({
        description: `Meal ${i + 1}`,
        calories: 100 + i,
    }));
    const five = eleven.slice(0, 5);
    const ctx = (opts: Parameters<typeof macrosApi.macroCtxOf>[4]) =>
        macrosApi.macroCtxOf(VALS, GOALS, undefined, eleven, opts);
    const cal = macroOf("calories");
    // A true count: exact, against the count rather than the rows.
    expect(
        macrosApi.mealList(
            cal,
            eleven,
            ctx({ bounded: true, contributors: { calories: 14 } }),
        ),
    ).toContain("+ 6 smaller meals");
    // Bounded, no count, past the cap: a lower bound.
    const noMeta = macrosApi.mealList(cal, eleven, ctx({ bounded: true }));
    expect(noMeta).toContain("+ 3 or more smaller meals");
    // A null count (alcohol with tracking off) is "no count", never 0.
    expect(
        macrosApi.mealList(
            cal,
            eleven,
            ctx({ bounded: true, contributors: { calories: null } }),
        ),
    ).toContain("+ 3 or more smaller meals");
    // Complete rows (every other widget): exact, from the rows.
    const complete = macrosApi.mealList(cal, eleven, ctx({}));
    expect(complete).toContain("+ 3 smaller meals");
    expect(complete).not.toContain("or more");
    // Bounded but within the cap: nothing past it to hint at.
    expect(macrosApi.mealList(cal, five, ctx({ bounded: true }))).not.toContain(
        "md-more",
    );
});

// The commonest trim: one set of big meals leads every metric, so the server's
// union is exactly those 8 and every metric has exactly CAP rows. Without the
// _meta count nothing proves a meal is missing — or that none is — so the line
// must neither vanish (an implied complete list) nor state a number.
test("a bounded list of exactly 8 rows says 'possibly more' unless the window proves it complete", () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({
        description: `Meal ${i + 1}`,
        calories: 900 - i * 10,
    }));
    const cal = macroOf("calories");
    const list = (opts: Parameters<typeof macrosApi.macroCtxOf>[4]) =>
        macrosApi.mealList(
            cal,
            eight,
            macrosApi.macroCtxOf(VALS, GOALS, undefined, eight, opts),
        );
    // 12 meals in the window, 8 listed, no count: possibly more, no number.
    const trimmed = list({ bounded: true, mealTotal: 12 });
    expect(trimmed).toContain("+ possibly more smaller meals");
    expect(trimmed).not.toMatch(/\+ \d/);
    // Window total unknown: the same.
    expect(list({ bounded: true })).toContain("+ possibly more smaller meals");
    // The true count still wins: 12 contributors, 8 shown.
    expect(
        list({ bounded: true, mealTotal: 12, contributors: { calories: 12 } }),
    ).toContain("+ 4 smaller meals");
    // Every meal of the window arrived: the list is complete, no line.
    expect(list({ bounded: true, mealTotal: 8 })).not.toContain("md-more");
    // Not bounded (every other widget): complete, no line.
    expect(list({})).not.toContain("md-more");
});

// A bounded list the server did not actually trim (every meal made some
// metric's top 8) is complete, so its rows count exactly even without _meta.
test("a bounded list whose window total arrived in full counts exactly", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => ({
        description: `Meal ${i + 1}`,
        calories: 100 + i,
    }));
    const out = macrosApi.mealList(
        macroOf("calories"),
        eleven,
        macrosApi.macroCtxOf(VALS, GOALS, undefined, eleven, {
            bounded: true,
            mealTotal: 11,
        }),
    );
    expect(out).toContain("+ 3 smaller meals");
    expect(out).not.toContain("or more");
});

// Polish and Ukrainian put 2–4 in the "few" category, which the 5+ "other"
// genitive gets wrong ("3 mniejszych posiłków"); 2–4 is also the likeliest
// range for the "N more meals" line.
test("the 'N more meals' lines use the 'few' form in Polish and Ukrainian", async () => {
    const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
    const api = new Function(
        "WIDGET_STRINGS",
        `${i18nSrc}\nreturn { setLocale, plural, t: () => T };`,
    )(WIDGET_STRINGS) as {
        setLocale: (l: string) => void;
        plural: (forms: unknown, n: number) => string;
        t: () => typeof WIDGET_STRINGS_EN;
    };
    api.setLocale("pl");
    const pl = api.t().macros;
    expect(api.plural(pl.moreMeals, 1)).toBe("+ 1 mniejszy posiłek");
    expect(api.plural(pl.moreMeals, 3)).toBe("+ 3 mniejsze posiłki");
    expect(api.plural(pl.moreMeals, 5)).toBe("+ 5 mniejszych posiłków");
    expect(api.plural(pl.moreMealsAtLeast, 3)).toBe(
        "+ co najmniej 3 mniejsze posiłki",
    );
    api.setLocale("uk");
    const uk = api.t().macros;
    expect(api.plural(uk.moreMeals, 3)).toBe("+ ще 3 менші страви");
    expect(api.plural(uk.moreMeals, 5)).toBe("+ ще 5 менших страв");
    expect(api.plural(uk.moreMealsAtLeast, 3)).toBe(
        "+ ще щонайменше 3 менші страви",
    );
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
        [{ ...VALS, added_sugar_g: 14.3 }, GOALS, undefined],
        [
            { ...VALS, added_sugar_g: 31 },
            { ...GOALS, added_sugar_g: 25 },
            undefined,
        ],
    ];
    for (const [vals, goal, wording] of cases) {
        const labels = tileLabels(
            macrosApi.macroPanel(vals, goal, wording, MEALS_ADDED),
        );
        expect(Object.keys(labels).length).toBeGreaterThan(0);
        if (vals.added_sugar_g != null) {
            expect(labels.added_sugar_g).toBeDefined();
        }
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
// among them, and the column count travels with the markup. Once added sugar
// is on show, sugar and added sugar move into a two-column row of their own
// (the sugars row) placed before it, so the limits row never holds five.
const limitKeys = (html: string) =>
    [...html.matchAll(/<span class="mkey">([^<]+)<\/span>/g)]
        .map((m) => m[1]!)
        .slice(3); // the first three are protein / carbs / fat

// The rows of limit cells in order: their class, style and cell names. Each
// row runs to the next one (the last to the end, where no .mkey follows).
const limitRows = (html: string) =>
    html
        .split('<div class="mgrid lim')
        .slice(1)
        .map((seg) => {
            const head = /^([^"]*)" style="([^"]*)"/.exec(seg)!;
            return {
                cls: `mgrid lim${head[1]}`,
                style: head[2]!,
                keys: [
                    ...seg.matchAll(/<span class="mkey">([^<]+)<\/span>/g),
                ].map((k) => k[1]!),
            };
        });

test("the limits row is sugar, alcohol, caffeine, fiber — in that order", () => {
    expect(limitKeys(macrosApi.macroPanel(VALS, GOALS))).toEqual([
        "Sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
});

// The strip reads macro bars → [Sugar, Added sugar] → [Alcohol, Caffeine,
// Fiber] → water: total sugar, then the part of it that was added, side by
// side, before the rest of the limits.
test("with added sugar the sugars row comes first, then alcohol, caffeine, fiber", () => {
    const html = macrosApi.macroPanel({ ...VALS, added_sugar_g: 14.3 }, GOALS);
    expect(limitKeys(html)).toEqual([
        "Sugar",
        "Added sugar",
        "Alcohol",
        "Caffeine",
        "Fiber",
    ]);
    expect(limitRows(html)).toEqual([
        {
            cls: "mgrid lim pair psec",
            style: "--lc:2;--lcw:2",
            keys: ["Sugar", "Added sugar"],
        },
        {
            cls: "mgrid lim n3 psec",
            style: "--lc:3;--lcw:3",
            keys: ["Alcohol", "Caffeine", "Fiber"],
        },
    ]);
    // Both sit before the water line and the hint, after the macro bars.
    expect(html.indexOf("lim pair")).toBeLessThan(html.indexOf("lim n3"));
    expect(html.indexOf("lim n3")).toBeLessThan(html.indexOf("wrow"));
});

// Two columns at every width, whatever the limits row beside it does: the
// sugars row is what lets both full names fit.
test("the sugars row is two columns at every width", () => {
    for (const vals of [
        { ...VALS, added_sugar_g: 14.3 },
        { ...VALS, added_sugar_g: 14.3, alcohol_g: null },
        { ...VALS, added_sugar_g: 14.3, alcohol_g: null, caffeine_mg: null },
    ]) {
        const rows = limitRows(macrosApi.macroPanel(vals, GOALS));
        expect(rows[0]).toMatchObject({
            cls: "mgrid lim pair psec",
            style: "--lc:2;--lcw:2",
            keys: ["Sugar", "Added sugar"],
        });
    }
    // Alcohol off leaves two limits; alcohol and caffeine off, one.
    expect(
        limitRows(
            macrosApi.macroPanel(
                { ...VALS, added_sugar_g: 14.3, alcohol_g: null },
                GOALS,
            ),
        )[1],
    ).toMatchObject({ cls: "mgrid lim n2 psec", style: "--lc:2;--lcw:2" });
});

// Added sugar on show with no sugar cell (a 0 g day with an added-sugar limit
// and no total limit): the sugars row holds added sugar alone, at the same
// half width it has beside sugar.
test("added sugar without a sugar cell is alone in the sugars row, half width", () => {
    const bare = { calories: 500, protein_g: 20, carbs_g: 60, fat_g: 10 };
    const rows = limitRows(
        macrosApi.macroPanel(
            { ...bare, sugar_g: 0, added_sugar_g: 0, fiber_g: 3 },
            { added_sugar_g: 25 },
        ),
    );
    expect(rows).toEqual([
        {
            cls: "mgrid lim pair psec",
            style: "--lc:2;--lcw:2",
            keys: ["Added sugar"],
        },
        { cls: "mgrid lim n1 psec", style: "--lc:1;--lcw:1", keys: ["Fiber"] },
    ]);
});

// Without added sugar on show nothing moves: one limits row, sugar first, and
// no sugars row at all.
test("without added sugar there is no sugars row and sugar stays in the limits row", () => {
    for (const vals of [VALS, { ...VALS, added_sugar_g: undefined }]) {
        const html = macrosApi.macroPanel(vals as Vals, GOALS);
        expect(html).not.toContain("lim pair");
        expect(limitRows(html)).toEqual([
            {
                cls: "mgrid lim n4 psec",
                style: "--lc:2;--lcw:4",
                keys: ["Sugar", "Alcohol", "Caffeine", "Fiber"],
            },
        ]);
    }
});

test("the limits-row layout rules in macros.css", async () => {
    const css = await Bun.file(`${SRC}/shared/macros.css`).text();
    // Never five cells, so no five-cell rule; no short labels to swap in.
    expect(css).not.toContain(".n5");
    expect(css).not.toContain("mkey-short");
    expect(css).not.toContain("mkey-full");
    // No width-bounded rule may change the sugars row's two columns.
    expect(css).not.toMatch(/\.mgrid\.lim\.pair \{\s*grid-template-columns/);
    // In the sugars row a name too long to sit beside its figure pushes the
    // figure onto the next line rather than ellipsising, and the two cells
    // share their row tracks so their bars stay level.
    expect(css).toMatch(/\.mgrid\.lim\.pair \.mtop \{\s*flex-wrap: wrap;/);
    expect(css).toMatch(
        /\.mgrid\.lim\.pair \.mtile \{[^}]*grid-template-rows: subgrid;/,
    );
    // Below 360px every limits row is two columns.
    expect(css).toMatch(
        /@media \(max-width: 359px\) \{\s*\.mgrid\.lim \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
});

// The full name is the only name: no abbreviation, in markup or in the
// accessible name.
test("added sugar is always named in full", () => {
    const html = macrosApi.macroPanel({ ...VALS, added_sugar_g: 14.3 }, GOALS);
    expect(html).toContain('<span class="mkey">Added sugar</span>');
    expect(html).not.toContain("mkey-");
    const tiles = tileLabels(
        macrosApi.macroPanel(
            { ...VALS, added_sugar_g: 6.2 },
            { ...GOALS, added_sugar_g: 25 },
            undefined,
            MEALS_ADDED,
        ),
    );
    expect(tiles.added_sugar_g).toBe(
        "Added sugar 6.2 g, limit 25 g, 18.8 g under. Show the meals that contributed.",
    );
});

test("every locale names added sugar", () => {
    for (const [loc, strings] of Object.entries(WIDGET_STRINGS)) {
        expect(strings.macros.labels.added_sugar_g, loc).toBeTruthy();
    }
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

// Added sugar is "data" like sugar, but it reaches the strip only through
// `_meta`: undefined (no `_meta`, or a day that did not record it) is no cell
// at all, even with a limit; a recorded 0 shows against a limit; 0 is a real
// ceiling.
test("added sugar earns a cell with a value or a limit, never without `_meta`", () => {
    const bare = { calories: 500, protein_g: 20, carbs_g: 60, fat_g: 10 };
    expect(
        limitKeys(macrosApi.macroPanel(bare, { added_sugar_g: 25 })),
    ).toEqual([]);
    expect(
        limitKeys(macrosApi.macroPanel({ ...bare, added_sugar_g: 0 }, null)),
    ).toEqual([]);
    expect(
        limitKeys(
            macrosApi.macroPanel(
                { ...bare, added_sugar_g: 0 },
                { added_sugar_g: 25 },
            ),
        ),
    ).toEqual(["Added sugar"]);
    expect(
        limitKeys(macrosApi.macroPanel({ ...bare, added_sugar_g: 3.5 }, null)),
    ).toEqual(["Added sugar"]);
    expect(line("added_sugar_g", 6, 0)).toBe("limit 0 g · 6 g over");
    expect(line("added_sugar_g", 35.2, 25)).toBe("limit 25 g · 10.2 g over");
});

// ---- added sugar from `_meta` ---------------------------------------------
//
// The acceptance day: two bananas (no added sugar, ~29 g natural) and a 330 ml
// cola (35 g, all added), with a 25 g added-sugar limit and no total limit.
const AS_DAY: AddedSugar = {
    v: 1,
    goal: 25,
    days: { "2026-10-04": 35 },
    meals: { b1: 0, b2: 0, cola: 35 },
};
const DAY_VALS = {
    calories: 350,
    protein_g: 2.6,
    carbs_g: 90,
    fat_g: 0.8,
    fiber_g: 6.2,
    sugar_g: 63.9,
    alcohol_g: null,
    caffeine_mg: 32,
    water_ml: 0,
};
const DAY_GOALS = {
    calories: 2000,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    sugar_g: null,
    alcohol_g: null,
    caffeine_mg: null,
    water_ml: null,
};
const DAY_MEALS = [
    { description: "Banana", meal_type: "snack", sugar_g: 14.4, calories: 105 },
    { description: "Banana", meal_type: "snack", sugar_g: 14.4, calories: 105 },
    { description: "Cola", meal_type: "snack", sugar_g: 35.1, calories: 140 },
];

test("without the added-sugar `_meta` the strip is exactly today's", () => {
    for (const raw of [undefined, null, {}, { v: 2, goal: 25 }, "x"]) {
        const as = macrosApi.addedSugarPayload(raw);
        expect(as).toBeNull();
        const m = macrosApi.withAddedSugar(
            as,
            macrosApi.addedSugarFor(as, ["2026-10-04"]),
            VALS,
            GOALS,
            MEALS,
        );
        expect(m.vals).toBe(VALS);
        expect(m.goal).toBe(GOALS);
        expect(m.meals).toBe(MEALS);
        expect(macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals)).toBe(
            macrosApi.macroPanel(VALS, GOALS, undefined, MEALS),
        );
    }
});

// The test above shows `withAddedSugar` is a pass-through without `_meta`; it
// compares the new code with itself, so it cannot show that the strip is what
// it was before added sugar existed. This does: every case is checked against
// the markup the pre-change shared/macros.js rendered (macros.golden.ts).
test("without `_meta` the strip is byte for byte the pre-added-sugar markup", () => {
    expect(Object.keys(NO_META_CASES).sort()).toEqual(
        Object.keys(NO_META_GOLDEN).sort(),
    );
    for (const [name, c] of Object.entries(NO_META_CASES)) {
        const as = macrosApi.addedSugarPayload(undefined);
        const m = macrosApi.withAddedSugar(
            as,
            macrosApi.addedSugarFor(as, ["2026-10-04"]),
            c.vals,
            c.goal ?? null,
            // undefined passes straight through, as it does from a template
            c.meals as unknown[] | null,
        );
        const html = macrosApi.macroPanel(
            m.vals,
            m.goal,
            c.wording,
            m.meals,
            c.opts as Parameters<typeof macrosApi.macroPanel>[4],
        );
        expect({ name, html }).toEqual({ name, html: NO_META_GOLDEN[name]! });
    }
});

test("the bananas-and-cola day shows added sugar over its limit beside an unlimited total", () => {
    const as = macrosApi.addedSugarPayload(AS_DAY);
    const m = macrosApi.withAddedSugar(
        as,
        macrosApi.addedSugarFor(as, ["2026-10-04"]),
        DAY_VALS,
        DAY_GOALS,
        DAY_MEALS,
    );
    expect(m.vals.added_sugar_g).toBe(35);
    expect(m.goal?.added_sugar_g).toBe(25);
    const html = macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals);
    expect(limitKeys(html)).toEqual([
        "Sugar",
        "Added sugar",
        "Caffeine",
        "Fiber",
    ]);
    const labels = tileLabels(html);
    expect(labels.added_sugar_g).toBe(
        "Added sugar 35 g, limit 25 g, 10 g over. Show the meals that contributed.",
    );
    expect(labels.sugar_g).toBe(
        "Sugar 63.9 g, no goal set. Show the meals that contributed.",
    );
    // With the old 25 g total limit set as well, both cells judge their own.
    const both = tileLabels(
        macrosApi.macroPanel(
            m.vals,
            { ...m.goal, sugar_g: 25 },
            undefined,
            m.meals,
        ),
    );
    expect(both.sugar_g).toContain("limit 25 g, 38.9 g over");
    expect(both.added_sugar_g).toContain("limit 25 g, 10 g over");
});

test("the added-sugar breakdown lists only meals with a value, joined by position", () => {
    const as = macrosApi.addedSugarPayload({
        v: 1,
        goal: 25,
        days: { "2026-10-04": 35 },
        meals: { b1: null, b2: 0, cola: 35 },
    });
    const m = macrosApi.withAddedSugar(as, 35, DAY_VALS, DAY_GOALS, DAY_MEALS);
    const ctx = macrosApi.macroCtxOf(m.vals, m.goal, undefined, m.meals!);
    const list = macrosApi.mealList(macroOf("added_sugar_g"), m.meals!, ctx);
    expect(list).toContain("Cola");
    expect(list).not.toContain("Banana");
    // A count that does not match the rows joins nothing: no tile to open.
    const off = macrosApi.withAddedSugar(
        macrosApi.addedSugarPayload({ v: 1, goal: 25, meals: { cola: 35 } }),
        35,
        DAY_VALS,
        DAY_GOALS,
        DAY_MEALS,
    );
    expect(off.meals).toBe(DAY_MEALS);
    expect(
        tileLabels(
            macrosApi.macroPanel(off.vals, off.goal, undefined, off.meals),
        ).added_sugar_g,
    ).toBeUndefined();
});

test("added sugar averages over the days that recorded it", () => {
    const as = macrosApi.addedSugarPayload({
        v: 1,
        goal: 25,
        days: { a: 10, b: null, c: 30, d: 0 },
    });
    expect(macrosApi.addedSugarFor(as, ["a", "b", "c", "d"])).toBe(40 / 3);
    expect(macrosApi.addedSugarFor(as, ["b"])).toBeUndefined();
    expect(macrosApi.addedSugarFor(as, ["zz"])).toBeUndefined();
    expect(macrosApi.addedSugarFor(null, ["a"])).toBeUndefined();
});

test("the summary's added-sugar count joins the per-metric contributors", () => {
    const as = macrosApi.addedSugarPayload({ ...AS_DAY, contributors: 12 });
    expect(macrosApi.withAddedSugarContributors(as, { calories: 20 })).toEqual({
        calories: 20,
        added_sugar_g: 12,
    });
    expect(macrosApi.withAddedSugarContributors(as, null)).toEqual({
        added_sugar_g: 12,
    });
    const none = { calories: 20 };
    expect(
        macrosApi.withAddedSugarContributors(
            macrosApi.addedSugarPayload(AS_DAY),
            none,
        ),
    ).toBe(none);
});

// get_nutrition_summary's rows are the union of the OTHER metrics' top 8
// (structuredContent is frozen, so added sugar ranks none in), which can drop
// the meal with the most added sugar of all. `_meta.extra` sends those meals;
// they join the added-sugar list only, in ranked position.
const SUMMARY_ROWS = [
    { description: "Granola", date: "2026-10-01", calories: 480, sugar_g: 22 },
    { description: "Pasta", date: "2026-10-02", calories: 720, sugar_g: 9 },
    { description: "Yogurt", date: "2026-10-03", calories: 180, sugar_g: 18 },
];
const SUMMARY_AS = {
    v: 1 as const,
    goal: 25,
    days: { "2026-10-01": 12, "2026-10-02": 30, "2026-10-03": 4 },
    meals: { g: 12, p: null, y: 4 },
    contributors: 5,
    extra: [
        {
            description: "Sweet iced tea",
            meal_type: "snack",
            date: "2026-10-02",
            added_sugar_g: 30,
        },
        {
            description: "Ketchup",
            meal_type: null,
            date: "2026-10-03",
            added_sugar_g: 5,
        },
    ],
};
const SUMMARY_VALS = {
    calories: 1400,
    protein_g: 60,
    carbs_g: 180,
    fat_g: 40,
    fiber_g: 20,
    sugar_g: 49,
    alcohol_g: null,
    caffeine_mg: null,
    water_ml: 0,
};
function summaryStrip(raw: unknown) {
    const as = macrosApi.addedSugarPayload(raw);
    const m = macrosApi.withAddedSugar(
        as,
        macrosApi.addedSugarFor(as, ["2026-10-01", "2026-10-02", "2026-10-03"]),
        SUMMARY_VALS,
        DAY_GOALS,
        SUMMARY_ROWS,
    );
    const opts = {
        bounded: true,
        contributors: macrosApi.withAddedSugarContributors(as, {
            calories: 6,
            sugar_g: 6,
        }),
        extraRows: m.extraRows,
    };
    const ctx = macrosApi.macroCtxOf(m.vals, m.goal, undefined, m.meals!, opts);
    const list = (key: string) =>
        macrosApi.mealList(macroOf(key), m.meals!, ctx);
    return { m, opts, list };
}
const names = (html: string) =>
    [...html.matchAll(/class="md-name">([^<]*)</g)].map((x) => x[1]);

test("the summary's added-sugar list ranks `extra` rows among the kept ones", () => {
    const { list } = summaryStrip(SUMMARY_AS);
    const added = list("added_sugar_g");
    // Ranked by added sugar across both sources; Pasta (null) stays out.
    expect(names(added)).toEqual([
        "Sweet iced tea",
        "Granola",
        "Ketchup",
        "Yogurt",
    ]);
    // An extra row keeps its date tag like any multi-day row.
    expect(added).toContain('class="md-sub">10-02<');
    // "+N more" stays exact: 5 contributors, 4 shown.
    expect(added).toContain("+ 1 smaller meal");
    expect(added).not.toContain("or more");
});

test("`extra` rows never reach another metric's list", () => {
    const { list } = summaryStrip(SUMMARY_AS);
    for (const key of ["sugar_g", "calories"]) {
        const out = list(key);
        expect(out, key).not.toContain("Sweet iced tea");
        expect(out, key).not.toContain("Ketchup");
        expect(names(out), key).toHaveLength(3);
    }
    // And the strip with them differs from the strip without them only in
    // the added-sugar tile (a button either way here): same calorie/sugar
    // tiles, same everything else.
    const { m, opts } = summaryStrip(SUMMARY_AS);
    const withExtra = macrosApi.macroPanel(
        m.vals,
        m.goal,
        undefined,
        m.meals!,
        opts,
    );
    const without = macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals!, {
        ...opts,
        extraRows: null,
    });
    expect(withExtra).toBe(without);
});

test("an added-sugar tile whose only contributors are `extra` rows still opens", () => {
    const { m, opts } = summaryStrip({
        ...SUMMARY_AS,
        meals: { g: 0, p: null, y: 0 },
    });
    const labels = tileLabels(
        macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals!, opts),
    );
    expect(labels.added_sugar_g).toContain("Show the meals that contributed.");
    const noExtra = summaryStrip({
        ...SUMMARY_AS,
        meals: { g: 0, p: null, y: 0 },
        extra: undefined,
    });
    expect(
        tileLabels(
            macrosApi.macroPanel(
                noExtra.m.vals,
                noExtra.m.goal,
                undefined,
                noExtra.m.meals!,
                noExtra.opts,
            ),
        ).added_sugar_g,
    ).toBeUndefined();
});

test("malformed `extra` entries are ignored, and at most 8 are taken", () => {
    const bad = [
        null,
        "x",
        42,
        { description: "No sugar field" },
        { description: "Zero", added_sugar_g: 0 },
        { description: "Negative", added_sugar_g: -3 },
        { description: "NaN", added_sugar_g: Number.NaN },
        { description: "Infinite", added_sugar_g: Infinity },
        { description: "String grams", added_sugar_g: "40" },
        { description: 7, added_sugar_g: 40 },
        { added_sugar_g: 40 },
        {
            description: "Kept row",
            meal_type: 3,
            date: {},
            added_sugar_g: 8,
            calories: 9999,
        },
    ];
    const { m, list } = summaryStrip({ ...SUMMARY_AS, extra: bad });
    const row = (m.extraRows!.added_sugar_g as Record<string, unknown>[])[0];
    expect(m.extraRows!.added_sugar_g).toHaveLength(1);
    // Rebuilt from the four fields alone: a stray calorie figure is dropped,
    // a non-string type or date becomes null.
    expect(row).toEqual({
        description: "Kept row",
        meal_type: null,
        date: null,
        added_sugar_g: 8,
    });
    expect(names(list("added_sugar_g"))).toEqual([
        "Granola",
        "Kept row",
        "Yogurt",
    ]);
    expect(list("calories")).not.toContain("Kept");
    // Not an array at all: nothing.
    for (const extra of [null, "rows", { 0: SUMMARY_AS.extra[0] }, 5]) {
        expect(summaryStrip({ ...SUMMARY_AS, extra }).m.extraRows).toBeNull();
    }
    // Twelve good rows: the first 8, in the order sent.
    const many = Array.from({ length: 12 }, (_, i) => ({
        description: `Drink ${i}`,
        meal_type: null,
        date: null,
        added_sugar_g: 50 - i,
    }));
    const capped = summaryStrip({ ...SUMMARY_AS, extra: many }).m.extraRows!
        .added_sugar_g as { description: string }[];
    expect(capped.map((r) => r.description)).toEqual(
        many.slice(0, 8).map((r) => r.description),
    );
});

test("`extra` is used only when the kept rows joined", () => {
    // as.meals of the wrong length: the join fails, so the extras alone would
    // be a "top" list missing its kept leaders — none are shown.
    const { m } = summaryStrip({ ...SUMMARY_AS, meals: { g: 12 } });
    expect(m.meals).toBe(SUMMARY_ROWS);
    expect(m.extraRows).toBeNull();
});

test("without `extra` every list and strip is exactly as before", () => {
    const { extra: _drop, ...noExtra } = SUMMARY_AS;
    for (const raw of [noExtra, { ...SUMMARY_AS, extra: [] }]) {
        const { m, opts, list } = summaryStrip(raw);
        expect(m.extraRows).toBeNull();
        const { extraRows: _x, ...before } = opts;
        expect(
            macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals!, opts),
        ).toBe(
            macrosApi.macroPanel(m.vals, m.goal, undefined, m.meals!, before),
        );
        for (const key of ["added_sugar_g", "sugar_g", "calories"]) {
            expect(list(key), key).toBe(
                macrosApi.mealList(
                    macroOf(key),
                    m.meals!,
                    macrosApi.macroCtxOf(
                        m.vals,
                        m.goal,
                        undefined,
                        m.meals!,
                        before,
                    ),
                ),
            );
        }
        expect(names(list("added_sugar_g"))).toEqual(["Granola", "Yogurt"]);
    }
});

test("nutrition-summary passes the added-sugar extra rows to the strip", async () => {
    const html = await Bun.file(
        `${SRC}/templates/nutrition-summary.html`,
    ).text();
    expect(html).toContain("extraRows: merged.extraRows");
});

// Every template that draws the strip reads the key itself (a widget cannot
// import src/widgets.ts), so each must spell it exactly.
test("every macro template reads the added-sugar `_meta` key", async () => {
    for (const t of [
        "nutrition-summary",
        "goal-progress",
        "meal-logged",
        "trends",
        "component-gallery",
    ]) {
        const html = await Bun.file(`${SRC}/templates/${t}.html`).text();
        expect(html, t).toContain('"nutrition-mcp.com/added-sugar"');
        expect(html, t).toContain("withAddedSugar(");
    }
});

test("--added-sugar is defined in every token block", async () => {
    const css = await Bun.file(`${SRC}/shared/tokens.css`).text();
    expect(css.match(/--added-sugar:/g)?.length).toBe(
        css.match(/--sugar:/g)?.length,
    );
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

test("mealList's CAP and the extra-row cap equal MEAL_BREAKDOWN_TOP_N", async () => {
    // get_nutrition_summary keeps exactly the rows the list can show; a
    // mismatch makes the list and its "+N more" count disagree.
    const { MEAL_BREAKDOWN_TOP_N } = await import("../../src/widgets");
    const src = await Bun.file(`${SRC}/shared/macros.js`).text();
    expect(src.match(/const CAP = (\d+);/)?.[1]).toBe(
        String(MEAL_BREAKDOWN_TOP_N),
    );
    expect(src.match(/if \(rows\.length >= (\d+)\) break;/)?.[1]).toBe(
        String(MEAL_BREAKDOWN_TOP_N),
    );
});
