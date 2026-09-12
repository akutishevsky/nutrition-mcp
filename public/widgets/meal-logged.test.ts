// Render test for the meal-logged widget — the card shown after every
// log_meal / update_meal, and so the one users see most.
//
// Its whole move onto the tiered strip is one opts flag (`tiers: true` on the
// macroPanel call), and nothing else inspects this widget's assembled markup:
// src/widgets.test.ts checks assembly, macros.test.ts drives macros.js on its
// own. Dropping the flag would silently bring back the flat rail (and the dead
// grid cell beside Fiber it used to leave), so this pins it against the real
// assembled script. It also pins the product contract that a user with no
// goals gets an EMPTY root — the host collapses the frame to nothing — and the
// date rule: the year of a past-year meal shows on the header line only, never
// on the calorie panel's label, whose tail (ja's metric word) an ellipsis eats.
//
// Same evaluation technique as summary-caption.test.ts: the real assembled
// widget script, run as one function with the `initWidget({…})` bootstrap cut
// off. `document` / `window` are parameters of that function, so the stubs
// below shadow nothing global and every other test file is unaffected.
import { test, expect } from "bun:test";

type Root = { innerHTML: string };

async function freshMealLogged() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("meal-logged");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("meal-logged bootstrap not found");

    // Just enough DOM for render(): setLocale stamps <html lang>, macros.js
    // wires its delegated listeners once, and macroSnapshot/macroRestore ask
    // the root what was open (nothing, on a fresh root) and where focus is
    // (nowhere — activeElement null).
    const root: Root & Record<string, unknown> = {
        innerHTML: "",
        querySelector: () => null,
        querySelectorAll: () => [],
        contains: () => false,
    };
    const document = {
        getElementById: (id: string) => (id === "root" ? root : null),
        documentElement: { lang: "", setAttribute() {} },
        activeElement: null,
        addEventListener() {},
    };
    const window = {};
    const factory = new Function(
        "document",
        "window",
        `${script.slice(0, boot)}
         return { render, SAMPLE };`,
    );
    const api = factory(document, window) as {
        render: (data: unknown) => void;
        SAMPLE: Record<string, unknown>;
    };
    return { ...api, root };
}

const { render, SAMPLE, root } = await freshMealLogged();

const renderOf = (data: unknown) => {
    render(data);
    return root.innerHTML;
};

// Local, so the year rule below does not depend on today's date.
const THIS_YEAR = new Date().getFullYear();

test("the sample renders the tiered strip", () => {
    const html = renderOf(SAMPLE);
    expect(html).toContain('class="strip tiered');
    // Protein / carbs / fat on one three-wide rail…
    expect(html).toMatch(/class="rail r-macro" data-n="3"/);
    // …and water on its own bar. The sample tracks no alcohol, so the limits
    // rail has fiber, sugar and caffeine — three tiles, no dead fourth cell.
    expect(html).toMatch(/class="rail r-water" data-n="1"/);
    expect(html).toMatch(/class="rail r-limit" data-n="3"/);
    // The header is untouched by the port: the '+N kcal' pill stays the meta.
    expect(html).toContain('class="cmeta kcal"');
});

test("no goals renders nothing at all", () => {
    renderOf(SAMPLE);
    expect(renderOf({ ...SAMPLE, has_goals: false })).toBe("");
    expect(renderOf({ ...SAMPLE, goals: null })).toBe("");
    expect(renderOf(null)).toBe("");
});

// The limits rail lays itself out to its own tile count (railOf's data-n), so
// both directions of the alcohol / caffeine gates must move it.
test("the limits rail counts only the limits it shows", () => {
    const alcoholOn = {
        ...SAMPLE,
        drink_unit: "us",
        goals: { ...(SAMPLE.goals as object), alcohol_g: 28 },
        totals: { ...(SAMPLE.totals as object), alcohol_g: 14 },
    };
    expect(renderOf(alcoholOn)).toMatch(/class="rail r-limit" data-n="4"/);

    const noCaffeine = {
        ...SAMPLE,
        goals: { ...(SAMPLE.goals as object), caffeine_mg: null },
        totals: { ...(SAMPLE.totals as object), caffeine_mg: null },
    };
    expect(renderOf(noCaffeine)).toMatch(/class="rail r-limit" data-n="2"/);
});

test("a past-year meal names its year on the header line only", () => {
    const html = renderOf({ ...SAMPLE, date: `${THIS_YEAR - 1}-11-20` });
    const csub = html.match(/<span class="csub">([^<]*)<\/span>/);
    expect(csub?.[1]).toContain(String(THIS_YEAR - 1));
    // The calorie panel's label is "Calories on 20 Nov" — the year would be
    // a second copy on one card and, in ja, push the metric word out.
    const flabel = html.match(/class="flabel"[^>]*>([^<]*)</);
    expect(flabel?.[1]).toBeTruthy();
    expect(flabel?.[1]).not.toContain(String(THIS_YEAR - 1));
});

test("a this-year meal prints no year anywhere", () => {
    const html = renderOf({ ...SAMPLE, date: `${THIS_YEAR}-01-02` });
    expect(html).not.toContain(String(THIS_YEAR));
});
