// goal-progress' weight row, as the shared strip actually hands it out.
//
// The row is the one control on this card that writes its own `aria-controls`
// (it is the template's markup, not the strip's — see `opts.extra` /
// macroExtraOf in shared/macros.js), and its drawer body is the one that
// writes the `.dname` the drawer is labelled by. Both used to interpolate a
// module-level default id instead of the per-strip ids they are handed, which
// is invisible in an iframe holding one strip and wrong the moment two strips
// share a document — the public site's landing page builds its cards from
// these same partials, and `aria-controls` / `aria-labelledby` resolve by id,
// so the second card's weight row addressed the FIRST card's drawer.
//
// Same evaluation technique as summary-caption.test.ts: the real assembled
// widget script is run as one script with only the `initWidget({…})`
// bootstrap cut off, so what is tested is what ships.
import { test, expect } from "bun:test";
import { getWidgetHtml } from "../../src/widgets.js";

// Enough of a DOM for the partials' guarded wiring and no more. Handed in as
// PARAMETERS, never set on globalThis — `bun test` shares one process across
// files, and macros.test.ts's markup half deliberately runs with no document.
function stubDom() {
    const root = {
        innerHTML: "",
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        contains: () => false,
    };
    return {
        getElementById: (id: string) => (id === "root" ? root : null),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        activeElement: null,
        hasFocus: () => false,
    };
}

interface Extra {
    key: string;
    row: (i: number, drawerId: string) => string;
    detail: ((drawerNameId: string) => string) | null;
}

async function freshGoalProgress() {
    const html = await getWidgetHtml("goal-progress");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("goal-progress bootstrap not found");
    return new Function(
        "document",
        "window",
        `${script.slice(0, boot)}
         return { weightExtra, macroPanel, macroCtx, setLocale, setWaterUnit };`,
    )(stubDom(), {}) as {
        weightExtra: (w: unknown) => Extra;
        macroPanel: (
            vals: unknown,
            goal: unknown,
            wording: unknown,
            meals: unknown,
            opts: Record<string, unknown>,
        ) => string;
        macroCtx: () => { drawerId: string; drawerNameId: string };
        setLocale: (code: string) => unknown;
        setWaterUnit: (code: string) => void;
    };
}

const api = await freshGoalProgress();
api.setLocale("en");
api.setWaterUnit("l");

const GOALS = {
    calories: 2400,
    protein_g: 160,
    carbs_g: 260,
    fat_g: 80,
    fiber_g: 30,
    sugar_g: 45,
    alcohol_g: 20,
    caffeine_mg: 400,
    water_ml: 2500,
};
const TOTALS = {
    calories: 1810,
    protein_g: 118,
    carbs_g: 190,
    fat_g: 62,
    fiber_g: 21,
    sugar_g: 32,
    alcohol_g: null,
    caffeine_mg: 187,
    water_ml: 2100,
};
const MEALS = [
    {
        description: "Oatmeal",
        meal_type: "breakfast",
        logged_at: "2025-09-08T08:00:00Z",
        calories: 520,
        protein_g: 18,
        carbs_g: 72,
        fat_g: 16,
    },
];
const WEIGHT = {
    current: 78.4,
    target: 75,
    unit: "kg",
    logged_on: "2025-07-14",
};

function strip(idPrefix?: string) {
    const extra = api.weightExtra(WEIGHT);
    const html = api.macroPanel(TOTALS, GOALS, undefined, MEALS, {
        tiers: true,
        idPrefix,
        extra,
    });
    // The ids macroPanel resolved for THIS strip, read back off the ctx it
    // stashed rather than rebuilt here — the drawer body is written by
    // macroToggle from the same pair when the row is tapped.
    const ctx = api.macroCtx();
    return { html, extra, ctx };
}

// TWO STRIPS IN ONE DOCUMENT. Every pointer on a card must resolve inside that
// card: the drawer's own id, the tiles' aria-controls, the weight row's
// aria-controls, and the `.dname` its drawer body labels the region by.
test("the weight row and its drawer body follow this strip's ids", () => {
    for (const prefix of ["card-a", "card-b"]) {
        const { html, extra, ctx } = strip(prefix);
        expect(ctx.drawerId).toBe(`${prefix}-drawer`);
        expect(ctx.drawerNameId).toBe(`${prefix}-drawer-name`);
        expect(html).toContain(
            `<div class="drawer" id="${prefix}-drawer" role="region" aria-labelledby="${prefix}-drawer-name"`,
        );
        // The row the template wrote, spliced into the strip.
        expect(html).toContain(
            `data-macro-extra="weight" aria-expanded="false" aria-controls="${prefix}-drawer"`,
        );
        // …and the body it opens, which names the region.
        expect(extra.detail?.(ctx.drawerNameId)).toContain(
            `<b class="dname" id="${prefix}-drawer-name">`,
        );
        // Nothing on this card points anywhere else, the historical default
        // included — that default is exactly what the row used to emit.
        const other = prefix === "card-a" ? "card-b" : "card-a";
        expect(html).not.toContain(other);
        expect(html).not.toContain('"macro-drawer');
    }
});

// The prefix may move the ids and NOTHING else: strip it out and the two cards
// are the same bytes, and the card with no prefix is the one every in-chat
// widget has always rendered.
test("idPrefix moves the ids and nothing else", () => {
    const a = strip("card-a").html;
    const b = strip("card-b").html;
    expect(a.split("card-a").join("X")).toBe(b.split("card-b").join("X"));
    expect(strip().html).toBe(a.split("card-a-drawer").join("macro-drawer"));
});

// The reading-less state is a line of text with nothing to disclose, so it
// writes no aria-controls at all — and must not grow one from a stray id.
test("a weight row with no reading discloses nothing", () => {
    const extra = api.weightExtra(null);
    expect(extra.detail).toBeNull();
    expect(extra.row(8, "card-a-drawer")).not.toContain("aria-controls");
});
