import { test, expect } from "bun:test";
import { getWidgetHtml, WIDGET_TEMPLATES } from "./widgets.js";
import { WIDGET_STRINGS } from "./copy/widgets.js";

const KEYS = Object.keys(WIDGET_TEMPLATES);
const SRC = "./public/widgets/src";
const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;

// Every widget must assemble from its source partials into a self-contained
// document — no unresolved @include markers, valid inline JS, single style/script.
test.each(KEYS)("%s assembles into a self-contained widget", async (key) => {
    const html = await getWidgetHtml(key);

    // No include marker left behind (the real marker, not the word in prose).
    expect(html.match(/\/\*@include/g)).toBeNull();
    // Same for the TS-inlining marker: an unresolved one would ship a widget
    // whose script silently lacks whole functions.
    expect(html.match(/\/\*@inlinets/g)).toBeNull();
    // Same for the i18n marker: an unresolved one would ship the literal
    // comment instead of the WIDGET_STRINGS dictionary shared/i18n.js needs.
    expect(html.match(/\/\*@i18n@\*\//g)).toBeNull();
    // Module syntax must not survive into the inline <script>.
    expect(html).not.toMatch(/^export\s/m);

    // Structure: one inlined stylesheet + one inlined script, no external refs.
    expect((html.match(/<style>/g) ?? []).length).toBe(1);
    expect((html.match(/<script>/g) ?? []).length).toBe(1);
    expect(html).not.toContain("<link");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html.trimStart().startsWith("<!doctype html>")).toBe(true);

    // Shared bridge got inlined and the widget wires itself to it exactly once.
    expect(html).toContain("function initWidget(config)");
    expect((html.match(/initWidget\(\{/g) ?? []).length).toBe(1);

    // Shared design tokens got inlined. `--acc` is Dawn's brand green and the
    // first declaration in tokens.css's `:root` block, so its presence is the
    // cheapest proof the whole partial made it in.
    expect(html).toContain("--acc: #15803d");

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

// Every unit code a widget prints goes through unitLabel(code), which falls
// back to the bare CODE when a locale lacks it — so a missing key does not
// fail, it silently prints "fl_oz" on a card. TypeScript catches a missing key
// in a typed locale file; this also catches an empty string, which it does not.
test.each(Object.keys(WIDGET_STRINGS))(
    "%s labels every unit code",
    (locale) => {
        const units = WIDGET_STRINGS[locale as keyof typeof WIDGET_STRINGS]!
            .units as Record<string, unknown> | undefined;
        for (const code of [
            "kcal",
            "kj",
            "g",
            "mg",
            "ml",
            "l",
            "fl_oz",
            "kg",
            "lb",
        ]) {
            const label = units?.[code];
            expect({
                code,
                ok: typeof label === "string" && !!label.trim(),
            }).toEqual({ code, ok: true });
        }
    },
);

// Every PluralForms value in a dictionary, by dotted path — anything shaped
// { one: string, other: string }.
function pluralForms(
    node: unknown,
    path = "",
): Array<[string, Record<string, string>]> {
    if (!node || typeof node !== "object" || Array.isArray(node)) return [];
    const o = node as Record<string, unknown>;
    if (typeof o.one === "string" && typeof o.other === "string")
        return [[path, o as Record<string, string>]];
    return Object.entries(o).flatMap(([k, v]) =>
        pluralForms(v, path ? `${path}.${k}` : k),
    );
}

// Ukrainian and Polish integers split three ways, and with only one/other every
// count of 2–4 took the genitive plural: "3 днів з записами" for "3 дні з
// записами", "+ 3 mniejszych posiłków" for "+ 3 mniejsze posiłki". Nothing but
// this test notices a new PluralForms key added with two forms, because
// plural() quietly falls back to "other".
test.each(["uk", "pl"] as const)(
    "%s carries few and many on every plural string",
    (locale) => {
        const all = pluralForms(WIDGET_STRINGS[locale]);
        // Same set of plural strings as English, so none was missed by the walk.
        expect(all.map(([p]) => p)).toEqual(
            pluralForms(WIDGET_STRINGS.en).map(([p]) => p),
        );
        for (const [path, forms] of all) {
            expect({ path, few: !!forms.few, many: !!forms.many }).toEqual({
                path,
                few: true,
                many: true,
            });
        }
        // …and the engine really does sort counts into those categories.
        const rules = new Intl.PluralRules(locale);
        expect([1, 3, 5, 12, 22, 25].map((n) => rules.select(n))).toEqual([
            "one",
            "few",
            "many",
            "many",
            "few",
            "many",
        ]);
    },
);
