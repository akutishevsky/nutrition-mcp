// The dev gallery's contract with the shared strip code, pinned against its
// SOURCE (the gallery has no tool, so no payload test reaches it).
//
// The bug this exists for: macroPanel stashes ONE ctx for the delegated
// handlers, and the gallery renders dozens of strips around its one live
// card. Every specimen call used to take that slot, so tapping the live card
// opened a drawer built from whichever specimen rendered last. The fix is
// `stash: false` on every specimen — and nothing but this test notices a new
// specimen that forgets it, because the page still renders perfectly.
import { test, expect } from "bun:test";
import { getWidgetHtml } from "../../src/widgets.js";

const SRC = "./public/widgets/src/templates/component-gallery.html";

// The template's own script, with comments removed so a `macroPanel(` in
// prose is never mistaken for a call. Only the template's text is scanned —
// the included partials are other files, and macros.js defines macroPanel.
async function script(): Promise<string> {
    const html = await Bun.file(SRC).text();
    const body = html.slice(
        html.indexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    return body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// The argument text of every call to `name(` in `src`, by paren depth. The
// arguments here are object literals and arrow functions — balanced parens,
// no string holding a lone paren — so depth counting is exact enough.
function callArgs(src: string, name: string): string[] {
    const out: string[] = [];
    const re = new RegExp(`\\b${name}\\(`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
        let depth = 1;
        let i = m.index + m[0].length;
        const start = i;
        for (; i < src.length && depth > 0; i++) {
            if (src[i] === "(") depth++;
            else if (src[i] === ")") depth--;
        }
        out.push(src.slice(start, i - 1));
    }
    return out;
}

test("exactly one macroPanel call stashes its ctx: the live card's", async () => {
    const calls = callArgs(await script(), "macroPanel");
    // Call SITES, not specimens: one helper builds most of the tiered ones.
    // At least the live card and one specimen site, or the scan found nothing.
    expect(calls.length).toBeGreaterThanOrEqual(2);
    const stashing = calls.filter((a) => !/stash:\s*false/.test(a));
    expect(stashing).toHaveLength(1);
    // …and it is the live card's: the one wired to the sparkline.
    expect(stashing[0]).toContain("onSeries");
    expect(stashing[0]).toContain("sparkPaint");
});

test("the live card restores what was open, scoped to #g-live", async () => {
    const src = await script();
    expect(src).toContain('macroSnapshot(document.getElementById("g-live"))');
    expect(src).toMatch(/macroRestore\(liveRoot, was\)/);
    // The restore runs LAST, after the first sparkline paint (its onSeries
    // repaints the panel over that paint).
    expect(src.lastIndexOf("macroRestore(")).toBeGreaterThan(
        src.lastIndexOf("sparkPaint(liveRoot"),
    );
});

test("no strip keeps the bridge's foot slot, so the note ends the page", async () => {
    const src = await script();
    // inertPanel strips it from every specimen…
    expect(src).toMatch(/"data-widget-foot",/);
    // …and the live strip drops it explicitly.
    expect(src).toContain('.replace(" data-widget-foot", "")');
});

test("includes: date.js after i18n.js and before svg.js; spark.js after macros.js", async () => {
    const html = await Bun.file(SRC).text();
    const at = (p: string) => html.indexOf(`/*@include shared/${p}@*/`);
    expect(at("date.js")).toBeGreaterThan(at("i18n.js"));
    expect(at("date.js")).toBeLessThan(at("svg.js"));
    expect(at("spark.js")).toBeGreaterThan(at("macros.js"));
    expect(at("spark.js")).toBeLessThan(html.indexOf("initWidget({"));
});

test("retired gallery code and classes stay gone", async () => {
    const src = await script();
    for (const gone of [
        "paintSeries",
        "seriesFoot",
        'id="g-chart"',
        'id="g-foot"',
        'class="slab"',
        "T.importMeals.stepOf",
    ]) {
        expect(src).not.toContain(gone);
    }
});

test("the assembled gallery carries the shared helpers it calls", async () => {
    const html = await getWidgetHtml("component-gallery");
    for (const fn of [
        "function rangeLabel(",
        "function calendarSlots(",
        "function sparkMarkup(",
        "function macroSnapshot(",
        "function chMarksMarkup(",
    ]) {
        expect(html).toContain(fn);
    }
});
