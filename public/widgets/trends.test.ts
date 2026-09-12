import { test, expect } from "bun:test";
import { getWidgetHtml } from "../../src/widgets.js";
import { WIDGET_STRINGS } from "../../src/copy/widgets.js";

// The trends widget after its move onto nutrition-summary's layout: the chart
// lives in the focus panel (shared/spark.js), the strip is tiered, and the
// panel's label keeps the averaging denominator when a tile moves it. These
// pin what a later edit could quietly undo; the rendered behaviour is signed
// off in the harness (`bun run harness`, /host?widget=trends).

const SRC = "./public/widgets/src/templates/trends.html";

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
    // Read off the TEMPLATE, not the assembled page: the page inlines the
    // whole WIDGET_STRINGS dictionary, which may still carry a retired key.
    const src = await Bun.file(SRC).text();
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

test("trends' header puts the window meta before the toggle", async () => {
    const src = await Bun.file(SRC).text();
    // A screen reader hears which window the figures cover before the control
    // that changes it; `.cmeta.crow` (base.css) restores the visual order.
    const meta = src.indexOf('class="cmeta crow" id="tr-meta"');
    const seg = src.indexOf('class="seg" role="group"');
    expect(meta).toBeGreaterThan(-1);
    expect(seg).toBeGreaterThan(meta);
    expect(src).toContain("tiers: true");
});

// metricLabelFor / chartLabelFor are pure; lift them out of the template and
// run them against the real dictionaries.
async function labelFns(locale: keyof typeof WIDGET_STRINGS) {
    const src = await Bun.file(SRC).text();
    const grab = (name: string) => {
        const at = src.indexOf(`function ${name}(`);
        const end = src.indexOf("\n            }\n", at);
        expect(at).toBeGreaterThan(-1);
        return src.slice(at, end + 14);
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
