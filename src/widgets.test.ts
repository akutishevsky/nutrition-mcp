import { test, expect } from "bun:test";
import { getWidgetHtml, WIDGET_TEMPLATES } from "./widgets.js";

const KEYS = Object.keys(WIDGET_TEMPLATES);
const SRC = "./public/widgets/src";
const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;

// Every widget must assemble from its source partials into a self-contained
// document — no unresolved @include markers, valid inline JS, single style/script.
test.each(KEYS)("%s assembles into a self-contained widget", async (key) => {
    const html = await getWidgetHtml(key);

    // No include marker left behind (the real marker, not the word in prose).
    expect(html.match(/\/\*@include/g)).toBeNull();

    // Structure: one inlined stylesheet + one inlined script, no external refs.
    expect((html.match(/<style>/g) ?? []).length).toBe(1);
    expect((html.match(/<script>/g) ?? []).length).toBe(1);
    expect(html).not.toContain("<link");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html.trimStart().startsWith("<!doctype html>")).toBe(true);

    // Shared bridge got inlined and the widget wires itself to it exactly once.
    expect(html).toContain("function initWidget(config)");
    expect((html.match(/initWidget\(\{/g) ?? []).length).toBe(1);

    // Shared design tokens got inlined.
    expect(html).toContain("--accent: #4a7c59");

    // The inlined <script> is syntactically valid JS.
    const script = html.slice(
        html.indexOf("<script>") + "<script>".length,
        html.indexOf("</script>"),
    );
    expect(() =>
        new Bun.Transpiler({ loader: "js" }).transformSync(script),
    ).not.toThrow();
});

// Guard against a partial being inlined incompletely (e.g. an extraction that
// truncates a component's CSS mid-block): every @include'd partial's full text
// must appear verbatim in the assembled output.
test.each(KEYS)("%s inlines each @include'd partial in full", async (key) => {
    const template = await Bun.file(
        `${SRC}/templates/${WIDGET_TEMPLATES[key]}`,
    ).text();
    const includes = [...template.matchAll(INCLUDE_RE)].map((m) => m[1]!);
    expect(includes.length).toBeGreaterThan(0);

    const html = await getWidgetHtml(key);
    for (const rel of includes) {
        const partial = (await Bun.file(`${SRC}/${rel}`).text()).trim();
        expect(html).toContain(partial);
    }
});

test("unknown widget key throws", async () => {
    expect(getWidgetHtml("nope")).rejects.toThrow(/unknown widget/);
});
