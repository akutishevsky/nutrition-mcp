// What the landing page's two widget cards actually render, in all nine
// locales.
//
// These cards used to be hand-approximated in scripts/gen-index.ts, and the
// approximation is what this file exists to stop coming back: the German
// mockup wrote "Kohlenhydrate" where the widget abbreviates to "Kohlenh.", the
// Japanese one wrote "糖類" where the widget says "糖質", the chart was a
// hardcoded polyline, and the daily goals were written down in three places.
// So the assertions below are deliberately about the things a second
// implementation gets wrong — the translated labels, the locale's own number
// grouping, the plural form of a count, the wash percentage behind a tile —
// rather than about the shape of the markup, which the widget's own suites
// under public/widgets/ already own.
//
// Nothing here mocks anything: it renders the real partials through
// src/widget-static.ts and parses the demo payloads against the real tool
// schemas.
import { test, expect, describe } from "bun:test";
import {
    macrosFor,
    renderSummaryCard,
    renderTrendsCard,
    scriptPartialsOf,
    type MacroEntry,
    type SummaryPayload,
} from "./widget-static.js";
import {
    DEMO_GOALS,
    DEMO_SUMMARY_DATE,
    DEMO_TRENDS,
    DEMO_TRENDS_RANGE,
    demoSummaryPayload,
    validateDemoPayloads,
    type DemoMealInput,
} from "./copy/widget-demo.js";
import { WIDGET_STRINGS } from "./copy/widgets.js";
import { SITE_LOCALES, type SiteLocale } from "./routes.js";

// ---- The payloads under test ---------------------------------------------

// The hero chat's four food exchanges. English-only and defined HERE rather
// than in src/copy/widget-demo.ts, which holds no reader-visible strings: a
// meal description is the user's own text and the landing page translates it,
// so the payload builder takes the rows as an argument (see DemoMealInput).
const HERO_MEALS: DemoMealInput[] = [
    {
        description: "Oatmeal with berries",
        meal_type: "breakfast",
        add: { kcal: 310, pro: 12, car: 52, fat: 8, sugar: 12 },
    },
    {
        description: "Flat white",
        meal_type: "breakfast",
        add: { kcal: 70, pro: 2, car: 4, fat: 3, caf: 130 },
    },
    {
        description: "Coca-Cola, 330 ml",
        meal_type: "snack",
        add: { kcal: 139, car: 35, sugar: 35 },
    },
    {
        description: "Big grilled chicken salad",
        meal_type: "lunch",
        add: { kcal: 540, pro: 46, car: 22, fat: 28, sugar: 6 },
    },
];

// Every exchange's `add` summed, water included — what the hero thread's
// replay arrives at, and so what its summary card totals.
const HERO_TOTALS = {
    kcal: 1059,
    pro: 60,
    car: 113,
    fat: 39,
    water: 500,
    sugar: 53,
    caf: 130,
};

const SUMMARY = demoSummaryPayload(HERO_TOTALS, HERO_MEALS);

// The figures the hero card prints, as value/goal pairs per MACROS key. Stated
// rather than re-derived from the payload so that a change to the payload has
// to be acknowledged here too.
const SUMMARY_TILES: Record<string, [value: number, goal: number]> = {
    calories: [1059, 2000],
    protein_g: [60, 160],
    carbs_g: [113, 220],
    fat_g: [39, 70],
    sugar_g: [53, 60],
    caffeine_mg: [130, 400],
    water_ml: [500, 2500],
};

// The trends card's default window averages over EVERY calendar day in it (all
// seven are logged, so here that is also the logged-day average). The last
// seven rows of DEMO_TRENDS_ROWS were chosen to land on exact integers; the
// first test below re-adds them to prove these are those numbers.
const TRENDS_TILES: Record<string, [value: number, goal: number]> = {
    calories: [1940, 2000],
    protein_g: [150, 160],
    carbs_g: [200, 220],
    fat_g: [68, 70],
    sugar_g: [52, 60],
    caffeine_mg: [160, 400],
    water_ml: [2200, 2500],
};

// A window whose logged days and calendar days are equal, which is what sends
// daysLoggedCaption down the plural() branch rather than the "N of M" one.
// Test-only: the landing page's own summary card covers a single day.
const THREE_DAY_SUMMARY: SummaryPayload = (() => {
    const base = demoSummaryPayload(HERO_TOTALS, HERO_MEALS);
    const day = (date: string, calories: number) => ({
        ...base.days[0]!,
        date,
        calories,
    });
    return {
        ...base,
        start_date: "2025-09-06",
        end_date: DEMO_SUMMARY_DATE,
        logged_days: 3,
        days_in_range: 3,
        days: [
            day("2025-09-06", 1880),
            day("2025-09-07", 1910),
            day(DEMO_SUMMARY_DATE, 1059),
        ],
    };
})();

// ---- Expected renderings, re-derived rather than called ------------------

/** What shared/fmt.js's fmt() and shared/macros.js's macroDecimal() print for
 *  a value on this metric's tile, worked out here from Intl directly.
 *
 *  Two rules, and the difference between them is a real bug this pins: a
 *  metric with a `display` (water alone) is converted and printed at FIXED
 *  decimals, so 2,200 ml is "2.2 L" and a round 2,000 ml is "2.0 L"; every
 *  other metric round-trips through Number() first, which is why sugar's one
 *  decimal disappears on a whole number ("53", never "53.0"). */
function printed(m: MacroEntry, locale: SiteLocale, value: number): string {
    if (m.display) {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: m.display.decimals,
            maximumFractionDigits: m.display.decimals,
        }).format(value / m.display.per);
    }
    const rounded = m.decimals
        ? Number(value.toFixed(m.decimals))
        : Math.round(value);
    return new Intl.NumberFormat(locale).format(rounded);
}

/** The `--p` wash the tile's own background fills to: the value as a
 *  percentage of its goal, clamped, to one decimal. */
function wash(value: number, goal: number): string {
    return ((Math.max(0, Math.min((value / goal) * 100, 100)) / 100) * 100)
        .toFixed(1)
        .concat("%");
}

/** Every control on a strip — the focus panel and each tile — sliced apart at
 *  its own opening tag, so an assertion about one tile cannot be satisfied by
 *  the tile after it.
 *
 *  Sliced on the ELEMENT rather than on `data-macro`, because a tile that is
 *  neither tappable nor on the chart is emitted as a plain `<span class="chip
 *  static">` with no data attribute at all — which is exactly what the hero
 *  card's water bar is (no meal carries water_ml, and a one-day window offers
 *  no chart series). The rails, the drawer and the foot bound the last one. */
function controlsOf(card: string): string[] {
    const boundary =
        /<(?:button|span) class="(?:focus|chip)\b|<div class="(?:rail|drawer|foot)\b/g;
    const at: number[] = [];
    for (const m of card.matchAll(boundary)) at.push(m.index);
    return at
        .map((start, i) => card.slice(start, at[i + 1] ?? card.length))
        .filter((slice) => /^<(?:button|span)/.test(slice));
}

/** The one control that carries this metric, found by its colour role class —
 *  the one thing every species of tile wears (see the `.c-*` classes in
 *  shared/base.css, which are also what sets `--c`). */
function tileOf(card: string, m: MacroEntry): string {
    const found = controlsOf(card).filter((slice) =>
        slice.slice(0, slice.indexOf(">")).includes(`${m.color}"`),
    );
    expect(found.length, `one control for ${m.key}`).toBe(1);
    return found[0]!;
}

/** Assert every tile on a card prints the payload's figure against its goal
 *  and fills its wash to the matching percentage. */
function expectTiles(
    card: string,
    locale: SiteLocale,
    macros: MacroEntry[],
    tiles: Record<string, [number, number]>,
    unitOf: (m: MacroEntry) => string,
): void {
    for (const [key, [value, goal]] of Object.entries(tiles)) {
        const m = macros.find((x) => x.key === key);
        expect(m, `no MACROS entry for ${key}`).toBeDefined();
        const tile = tileOf(card, m!);
        const figure = `${printed(m!, locale, value)}<span class="u">/${printed(m!, locale, goal)} ${unitOf(m!)}</span>`;
        expect(tile, `${locale} ${key} figure`).toContain(figure);
        // The calorie focus panel is a ring, not a wash: it states the same
        // fraction as a stroke-dashoffset instead of a `--p`.
        if (m!.role === "cal") continue;
        expect(tile, `${locale} ${key} wash`).toContain(
            `style="--p:${wash(value, goal)};`,
        );
    }
}

// The unit SYMBOL a metric prints in, from the locale's own dictionary — "L"
// in English, "л" in Ukrainian. Read from WIDGET_STRINGS rather than from the
// sandbox so the expectation has its own source.
function unitLabelFor(locale: SiteLocale) {
    const units = WIDGET_STRINGS[locale]!.units as Record<string, string>;
    return (m: MacroEntry) => {
        const code = m.display ? m.display.unit : m.unit;
        return units[code] ?? code;
    };
}

// ---- The tests ------------------------------------------------------------

describe("demo payloads", () => {
    test("the trends series adds up to the figures the card prints", () => {
        const window = DEMO_TRENDS.days.slice(-DEMO_TRENDS_RANGE);
        expect(window.length).toBe(7);
        const avg = (pick: (d: (typeof window)[number]) => number | null) => {
            const seen = window.map(pick).filter((v) => v != null);
            return seen.reduce((a, b) => a + b, 0) / seen.length;
        };
        expect(avg((d) => d.calories)).toBe(TRENDS_TILES.calories![0]);
        expect(avg((d) => d.protein_g)).toBe(TRENDS_TILES.protein_g![0]);
        expect(avg((d) => d.carbs_g)).toBe(TRENDS_TILES.carbs_g![0]);
        expect(avg((d) => d.fat_g)).toBe(TRENDS_TILES.fat_g![0]);
        expect(avg((d) => d.sugar_g)).toBe(TRENDS_TILES.sugar_g![0]);
        expect(avg((d) => d.caffeine_mg)).toBe(TRENDS_TILES.caffeine_mg![0]);
        expect(avg((d) => d.water_ml)).toBe(TRENDS_TILES.water_ml![0]);
    });

    test("each toggle window has a different, true days-logged count", () => {
        const logged = (n: number) =>
            DEMO_TRENDS.days.slice(-n).filter((d) => d.calories > 0).length;
        expect([logged(7), logged(14), logged(30)]).toEqual([7, 13, 28]);
        expect(DEMO_TRENDS.days.length).toBe(30);
    });

    test("both payloads match the live tool outputSchemas", async () => {
        await validateDemoPayloads(SUMMARY);
    });

    test("a stale key is caught rather than silently stripped", async () => {
        // The exact drift CLAUDE.md records for the harness fixtures: the
        // trends widget's window field is `default_range`, and `range_days`
        // survives a z.object().parse() as a key that simply never arrives.
        const stale = {
            ...SUMMARY,
            range_days: 7,
        } as unknown as SummaryPayload;
        await expect(validateDemoPayloads(stale)).rejects.toThrow(/range_days/);
    });

    test("the demo's goals are one object, not one per card", () => {
        expect(SUMMARY.goals).toBe(DEMO_GOALS);
        expect(DEMO_TRENDS.goals).toBe(DEMO_GOALS);
        expect(DEMO_GOALS.calories).toBe(2000);
    });

    test("the dates are fixed, not build-date-relative", () => {
        // A date derived from today would churn nine generated pages on every
        // run. A PAST year additionally pins the label: rangeNeedsYear prints
        // the year for any range outside the current one, so these render the
        // same bytes for ever.
        const thisYear = new Date().getFullYear();
        for (const iso of [
            DEMO_SUMMARY_DATE,
            DEMO_TRENDS.end_date,
            DEMO_TRENDS.days[0]!.date,
        ]) {
            expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(Number(iso.slice(0, 4))).toBeLessThan(thisYear);
        }
    });
});

describe("the build-time renderer", () => {
    test("reads its partial list from the template and drops bridge.js", async () => {
        const summary = await scriptPartialsOf("nutrition-summary");
        const trends = await scriptPartialsOf("trends");
        // The host handshake has no counterpart here; everything else the
        // template includes is evaluated.
        expect(summary).not.toContain("shared/bridge.js");
        expect(trends).not.toContain("shared/bridge.js");
        expect(summary).toContain("shared/summary-card.js");
        expect(trends).toContain("shared/trends-card.js");
        // In the template's own order, which is what the partials' own
        // "include after X" contracts are written against.
        expect(summary.indexOf("shared/i18n.js")).toBeLessThan(
            summary.indexOf("shared/macros.js"),
        );
        expect(summary.indexOf("shared/macros.js")).toBeLessThan(
            summary.indexOf("shared/summary-card.js"),
        );
    });

    test("rejects a range the toggle does not offer", async () => {
        await expect(renderTrendsCard(DEMO_TRENDS, "en", 10)).rejects.toThrow(
            /not one of/,
        );
    });

    test("is deterministic, and locales do not bleed into each other", async () => {
        const first = await renderTrendsCard(DEMO_TRENDS, "en", 7);
        await renderTrendsCard(DEMO_TRENDS, "de", 7);
        await renderSummaryCard(SUMMARY, "ja");
        const second = await renderTrendsCard(DEMO_TRENDS, "en", 7);
        expect(second).toBe(first);
    });
});

// Spread: SITE_LOCALES is a readonly array and `.each` wants a mutable one.
describe.each([...SITE_LOCALES])("the cards in %s", (locale) => {
    test("render with nothing unfilled", async () => {
        const cards = [
            await renderSummaryCard(SUMMARY, locale),
            await renderTrendsCard(DEMO_TRENDS, locale, DEMO_TRENDS_RANGE),
        ];
        for (const card of cards) {
            expect(card.length).toBeGreaterThan(2000);
            // An unsubstituted tpl()/plural() placeholder — "{metric}",
            // "{range}", "{n}" — is the single most likely translation bug and
            // renders as literal braces. Nothing else on these cards uses one.
            expect(card).not.toMatch(/\{[A-Za-z_]\w*\}/);
            expect(card).not.toContain("undefined");
            expect(card).not.toContain("NaN");
            // A dictionary miss falls back to English, which is silent; these
            // two are the markers that the card was built at all.
            expect(card).toContain('<div class="card c-cal">');
            expect(card).toContain("data-macro-panel");
        }
    });

    test("the card is the real one: three rails, the focus panel, a foot", async () => {
        const summary = await renderSummaryCard(SUMMARY, locale);
        const trends = await renderTrendsCard(
            DEMO_TRENDS,
            locale,
            DEMO_TRENDS_RANGE,
        );
        for (const card of [summary, trends]) {
            expect(card).toContain('<div class="glow"></div>');
            expect(card).toContain('<header class="chead">');
            // The tiers: the energy split, then the limits rail — sugar,
            // caffeine and fiber, which is on both cards now that the demo
            // account has a fiber goal (DEMO_GOALS) — and water last.
            expect(card).toContain('<div class="rail r-macro" data-n="3">');
            expect(card).toContain('<div class="rail r-limit" data-n="3">');
            expect(card).toContain('<div class="rail r-water" data-n="1">');
            // The focus panel and its ring.
            expect(card).toContain('class="fring"');
            expect(card).toContain('<div class="foot" data-widget-foot>');
        }
        // The summary card has meals behind its tiles, so they are disclosure
        // buttons with chevrons, they open a drawer, and the foot carries the
        // tap hint. This is the state a user actually sees in chat.
        expect(summary).toContain('aria-expanded="false"');
        expect(summary).toContain('class="chev"');
        expect(summary).toContain('<div class="drawer"');
        expect(summary).toContain("data-macro-hint");
        // A one-day window draws no line (summaryCharted needs two), so the
        // panel's chart slot is present and empty.
        expect(summary).toContain('<span class="fspark"></span>');

        // The trends payload carries no meals, so its tiles are the chart's
        // series selector instead — pressed state, no chevron, no drawer — and
        // the chart itself is spliced into the panel rather than painted in.
        expect(trends).toContain('aria-pressed="false"');
        expect(trends).not.toContain('<div class="drawer"');
        expect(trends).toMatch(
            /<span class="fspark">\s*<div class="cwrap c-cal">/,
        );
        expect(trends).toContain('<path class="cline"');
        expect(trends).toContain(
            `<button type="button" data-range="${DEMO_TRENDS_RANGE}" aria-pressed="true"`,
        );
    });

    test("every tile prints the payload's figure and fills to it", async () => {
        const { entries } = await macrosFor(locale);
        const unit = unitLabelFor(locale);
        expectTiles(
            await renderSummaryCard(SUMMARY, locale),
            locale,
            entries,
            SUMMARY_TILES,
            unit,
        );
        expectTiles(
            await renderTrendsCard(DEMO_TRENDS, locale, DEMO_TRENDS_RANGE),
            locale,
            entries,
            TRENDS_TILES,
            unit,
        );
    });

    test("the calorie ring states the same fraction as the figure", async () => {
        const card = await renderTrendsCard(
            DEMO_TRENDS,
            locale,
            DEMO_TRENDS_RANGE,
        );
        const [value, goal] = TRENDS_TILES.calories!;
        // The arc is drawn as a dash gap: circumference 2πr at r = 17, with
        // the unfilled remainder as the offset.
        const circumference = 2 * Math.PI * 17;
        const offset = (circumference * (1 - value / goal)).toFixed(2);
        expect(card).toContain(
            `stroke-dasharray="${circumference.toFixed(2)}"`,
        );
        expect(card).toContain(`stroke-dashoffset="${offset}"`);
    });

    test("figures are grouped the way this locale groups them", async () => {
        const card = await renderTrendsCard(
            DEMO_TRENDS,
            locale,
            DEMO_TRENDS_RANGE,
        );
        // Four-digit grouping is where the locales genuinely disagree — "2.000"
        // in German, a narrow no-break space in French, no separator at all in
        // Polish, Spanish and Italian — and it is what a hand-written mockup
        // gets wrong. Taken from Intl rather than written out, since that is
        // what fmt() itself calls.
        const grouped = new Intl.NumberFormat(locale).format(2000);
        expect(card).toContain(`/${grouped} `);
    });
});

describe("the translations the mockups got wrong", () => {
    test("German abbreviates Carbs the way the widget does", async () => {
        const card = await renderSummaryCard(SUMMARY, "de");
        expect(card).toContain(">Kohlenh.<");
        // What the hand-written landing copy said instead.
        expect(card).not.toContain("Kohlenhydrate");
        // And the German grouping separator, on the same card.
        expect(card).toContain("/2.000 kcal");
    });

    test("Japanese names sugar the way the widget does", async () => {
        const card = await renderSummaryCard(SUMMARY, "ja");
        expect(card).toContain(">糖質<");
        // What the hand-written landing copy said instead.
        expect(card).not.toContain("糖類");
    });

    test("French groups with a narrow no-break space", async () => {
        const card = await renderTrendsCard(DEMO_TRENDS, "fr", 7);
        expect(card).toContain("1 940");
        expect(card).not.toContain("1 940");
    });
});

describe("plural forms on the logged-days count", () => {
    // Ukrainian and Polish need `few` (2–4) and `many`; with only one/other
    // they printed "3 днів" where the language wants "3 дні". The count on
    // these cards goes through plural() (shared/i18n.js) via daysLoggedCaption,
    // so this is where a missing form would show up on the page.
    const forms = (locale: SiteLocale) =>
        WIDGET_STRINGS[locale]!.nutritionSummary.daysLogged;

    test.each(["uk", "pl"] as const)(
        "%s takes the `many` form for a fully logged 7-day window",
        async (locale) => {
            expect(new Intl.PluralRules(locale).select(7)).toBe("many");
            const f = forms(locale);
            expect(f.many).toBeTruthy();
            const card = await renderTrendsCard(DEMO_TRENDS, locale, 7);
            expect(card).toContain(f.many!.replace("{n}", "7"));
            // Not the singular, which is what a missing category falls back
            // through when `other` is absent too.
            expect(card).not.toContain(f.one.replace("{n}", "7"));
        },
    );

    test.each(["uk", "pl"] as const)(
        "%s takes the `few` form for a three-day window",
        async (locale) => {
            expect(new Intl.PluralRules(locale).select(3)).toBe("few");
            const f = forms(locale);
            expect(f.few).toBeTruthy();
            const card = await renderSummaryCard(THREE_DAY_SUMMARY, locale);
            expect(card).toContain(f.few!.replace("{n}", "3"));
            expect(card).not.toContain(f.one.replace("{n}", "3"));
        },
    );

    test("Ukrainian's few and many are genuinely different words", () => {
        // The assertion above is only worth something where the two forms
        // differ; in Polish they happen to share a spelling. Ukrainian is the
        // locale that would have shown "3 днів".
        const f = forms("uk");
        expect(f.few).not.toBe(f.many);
        expect(f.few).not.toBe(f.other);
    });

    test("English says '3 days logged'", async () => {
        const card = await renderSummaryCard(THREE_DAY_SUMMARY, "en");
        expect(card).toContain("3 days logged");
    });

    test("the three-day payload is a real one", async () => {
        await validateDemoPayloads(THREE_DAY_SUMMARY);
    });
});
