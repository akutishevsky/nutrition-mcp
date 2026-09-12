import { test, expect } from "bun:test";
import { getWidgetHtml } from "../../src/widgets.js";
import { WIDGET_STRINGS } from "../../src/copy/widgets.js";

// The trends widget after its move onto nutrition-summary's layout: the chart
// lives in the focus panel (shared/spark.js), the strip is tiered, and the
// panel's label keeps the averaging denominator when a tile moves it. These
// pin what a later edit could quietly undo; the rendered behaviour is signed
// off in the harness (`bun run harness`, /host?widget=trends).

const SRC = "./public/widgets/src/templates/trends.html";
// The card's composition — header, range slicing, averaging, the strip —
// moved out of the template into a shared partial, because the public landing
// page renders the same card at build time from the same payload shape. The
// template keeps only what needs a DOM.
const CARD = "./public/widgets/src/shared/trends-card.js";

test("trends assembles onto the shared sparkline, not a chart of its own", async () => {
    const html = await getWidgetHtml("trends");
    // spark.js is included AFTER macros.js (it calls MACROS / focusApply).
    const macros = html.indexOf("function macroPanel(");
    const spark = html.indexOf("function sparkPaint(");
    expect(macros).toBeGreaterThan(-1);
    expect(spark).toBeGreaterThan(macros);
    // One declaration each: a template-level copy of a shared name is a
    // SyntaxError that takes the whole widget script down.
    for (const name of [
        "ymd",
        "rangeLabel",
        "calendarSlots",
        "seriesValue",
        "chartableKeys",
    ]) {
        expect(html.split(`function ${name}(`).length - 1).toBe(1);
    }
    // The standalone chart block and its foot are gone, with their helpers.
    // Read off the SOURCES, not the assembled page: the page inlines the
    // whole WIDGET_STRINGS dictionary, which may still carry a retired key.
    const src = (await Bun.file(SRC).text()) + (await Bun.file(CARD).text());
    for (const gone of [
        "function applySeries(",
        "function seriesOf(",
        "function chartMarkup(",
        "function footHtml(",
        'id="chart"',
        "loggedOfTotal",
        // As options, not as words: the header comment says why the ring
        // came back, and names the option that used to drop it.
        "flatHero:",
        "divided:",
    ]) {
        expect(src).not.toContain(gone);
    }
});

// The template must stay a thin adapter: the composition belongs to the shared
// partial, so a build-time renderer gets the same card the chat does. A header
// rebuilt inline here is exactly the drift this split exists to stop.
test("the template composes through the shared partial, not inline", async () => {
    const src = await Bun.file(SRC).text();
    expect(src).toContain("root.innerHTML = trendsCard(view, { range });");
    expect(src).toContain("trendsView(STATE.data, range)");
    expect(src).toContain("/*@include shared/trends-card.js@*/");
    // …and none of what moved is left behind to drift.
    for (const gone of [
        "function viewFor(",
        "function metaFor(",
        "function sliceFor(",
        "function avgOf(",
        "function metricLabelFor(",
        "function chartLabelFor(",
        'id="tr-meta"',
        "const RANGES =",
    ]) {
        expect(src).not.toContain(gone);
    }
});

test("trends' header puts the window meta before the toggle", async () => {
    const src = await Bun.file(CARD).text();
    // A screen reader hears which window the figures cover before the control
    // that changes it; `.cmeta.crow` (base.css) restores the visual order.
    const meta = src.indexOf('class="cmeta crow" id="tr-meta"');
    const seg = src.indexOf('class="seg" role="group"');
    expect(meta).toBeGreaterThan(-1);
    expect(seg).toBeGreaterThan(meta);
    expect(src).toContain("tiers: true");
});

// metricLabelFor / chartLabelFor are pure; lift them out of the shared card
// partial and run them against the real dictionaries.
async function labelFns(locale: keyof typeof WIDGET_STRINGS) {
    const src = await Bun.file(CARD).text();
    const grab = (name: string) => {
        const at = src.indexOf(`function ${name}(`);
        expect(at).toBeGreaterThan(-1);
        // The partial is at column 0, so a lone "}" on its own line ends the
        // declaration.
        const end = src.indexOf("\n}\n", at);
        return src.slice(at, end + 3);
    };
    const T = WIDGET_STRINGS[locale]!;
    const tpl = (s: string, vars: Record<string, unknown>) =>
        String(s).replace(/\{(\w+)\}/g, (_, k) =>
            vars[k] == null ? `{${k}}` : String(vars[k]),
        );
    const macroLabel = (m: { label: string }) => m.label;
    return new Function(
        "T",
        "tpl",
        "macroLabel",
        `${grab("metricLabelFor")}\n${grab("chartLabelFor")}\nreturn { metricLabelFor, chartLabelFor };`,
    )(T, tpl, macroLabel) as {
        metricLabelFor: (n: number) => (m: object) => string;
        chartLabelFor: (n: number) => (m: object) => string;
    };
}

test("a moved panel keeps its denominator: all days vs days recorded", async () => {
    const { metricLabelFor, chartLabelFor } = await labelFns("en");
    const protein = { role: "macro", label: "Protein" };
    const water = { role: "bar", label: "Water" };
    const fiber = { role: "limit", label: "Fiber" };
    expect(metricLabelFor(14)(protein)).toBe("Protein · 14-day avg · all days");
    expect(metricLabelFor(7)(water)).toBe("Water · 7-day avg · all days");
    expect(metricLabelFor(30)(fiber)).toBe(
        "Fiber · 30-day avg · days recorded",
    );
    expect(chartLabelFor(7)({ role: "cal", label: "Calories" })).toBe(
        "Calories per day over the last 7 days",
    );
    expect(chartLabelFor(14)(protein)).toBe(
        "Protein per day over the last 14 days",
    );
});

test("every locale fills both label templates", async () => {
    for (const loc of Object.keys(WIDGET_STRINGS) as Array<
        keyof typeof WIDGET_STRINGS
    >) {
        const { metricLabelFor, chartLabelFor } = await labelFns(loc);
        for (const m of [
            { role: "macro", label: "X" },
            { role: "limit", label: "X" },
            { role: "cal", label: "X" },
        ]) {
            expect(metricLabelFor(7)(m)).not.toMatch(/\{\w+\}/);
            expect(chartLabelFor(7)(m)).not.toMatch(/\{\w+\}/);
        }
    }
});

// ---- the card's drawer ids -------------------------------------------------
//
// The landing page builds this card and the nutrition-summary one into ONE
// document (scripts/gen-index.ts), where ids are global: `opts.idPrefix`
// namespaces a strip's drawer pair so no card's `aria-controls` /
// `aria-labelledby` can reach into another's. This partial has to FORWARD it —
// it accepted the option and dropped it, which no markup here would have
// shown, because a trends payload carries no meals: nothing on this card
// discloses, so it emits no drawer and no aria-controls at all. The ids the
// strip resolved are visible only on the ctx macroPanel stashes, which is also
// exactly what a runtime tap would read, so that is what is pinned.
async function freshTrendsWidget() {
    const html = await getWidgetHtml("trends");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("trends bootstrap not found");
    // Enough of a DOM for the partials' guarded wiring and no more, handed in
    // as parameters rather than set on globalThis (`bun test` shares one
    // process across files).
    const root = {
        innerHTML: "",
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        contains: () => false,
    };
    const doc = {
        getElementById: (id: string) => (id === "root" ? root : null),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        activeElement: null,
        hasFocus: () => false,
    };
    return new Function(
        "document",
        "window",
        `${script.slice(0, boot)}
         return { trendsView, macroCtx, setLocale, setWaterUnit };`,
    )(doc, {}) as {
        trendsView: (
            data: unknown,
            range: number,
            opts?: { idPrefix?: string },
        ) => { body: string };
        macroCtx: () => { drawerId: string; drawerNameId: string };
        setLocale: (code: string) => unknown;
        setWaterUnit: (code: string) => void;
    };
}

test("trendsView hands its card's drawer ids to the strip", async () => {
    const api = await freshTrendsWidget();
    api.setLocale("en");
    api.setWaterUnit("l");
    const day = (date: string, i: number) => ({
        date,
        calories: 1800 + i * 10,
        protein_g: 110 + i,
        carbs_g: 190,
        fat_g: 60,
        fiber_g: 20,
        sugar_g: 30,
        alcohol_g: null,
        caffeine_mg: 120,
        water_ml: 2000,
    });
    const data = {
        end_date: "2025-09-07",
        default_range: 7,
        goals: {
            calories: 2400,
            protein_g: 160,
            carbs_g: 260,
            fat_g: 80,
            fiber_g: 30,
            sugar_g: 45,
            alcohol_g: 20,
            caffeine_mg: 400,
            water_ml: 2500,
        },
        drink_unit: null,
        water_unit: "l",
        days: [
            "2025-09-01",
            "2025-09-02",
            "2025-09-03",
            "2025-09-04",
            "2025-09-05",
            "2025-09-06",
            "2025-09-07",
        ].map(day),
    };

    const plain = api.trendsView(data, 7);
    expect(api.macroCtx().drawerId).toBe("macro-drawer");
    expect(api.macroCtx().drawerNameId).toBe("macro-drawer-name");

    const prefixed = api.trendsView(data, 7, { idPrefix: "demo" });
    expect(api.macroCtx().drawerId).toBe("demo-drawer");
    expect(api.macroCtx().drawerNameId).toBe("demo-drawer-name");
    // No meals, so there is no drawer to move: the prefix must cost the
    // markup nothing.
    expect(prefixed.body).toBe(plain.body);
    expect(prefixed.body).not.toContain("drawer");
});
