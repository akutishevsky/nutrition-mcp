// The nutrient glyphs as two-colour drawings: shared/icon.js's layered table,
// the string glyph() emits, and the tokens base.css paints the layers with.
//
// Nothing else would catch the two ways this degrades silently. A drawing that
// loses a layer, or an emitter that writes a colour, still renders a glyph. A
// --gl-* token missing from one theme block falls back to --ink2, so the glyph
// turns grey in exactly one theme and every other test stays green.
import { test, expect } from "bun:test";

const SHARED = "./public/widgets/src/shared";
const iconSrc = await Bun.file(`${SHARED}/icon.js`).text();
const macrosSrc = await Bun.file(`${SHARED}/macros.js`).text();
const tokensCss = await Bun.file(`${SHARED}/tokens.css`).text();
const baseCss = await Bun.file(`${SHARED}/base.css`).text();

type Layer = { d: string };
const { GLYPHS, glyph } = new Function(
    `${iconSrc}\nreturn { GLYPHS, glyph };`,
)() as {
    GLYPHS: Record<string, { a: Layer; b: Layer }>;
    glyph: (name: string, size?: number) => string;
};

// Every drawing a shipping surface names: each MACROS entry's `glyph`, read
// from the source rather than restated, plus goal-progress' weight row.
const SHIPPED = [
    ...new Set(
        [...macrosSrc.matchAll(/^\s+glyph: "([a-z]+)",$/gm)].map((m) => m[1]),
    ),
    "scale",
];

test("the shipped set is the whole table, and non-trivial", () => {
    expect(SHIPPED.length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(GLYPHS).sort()).toEqual([...SHIPPED].sort());
});

test("every glyph has a base and a detail layer", () => {
    for (const [name, g] of Object.entries(GLYPHS)) {
        expect(Object.keys(g).sort(), name).toEqual(["a", "b"]);
        for (const layer of [g.a, g.b]) {
            // A layer is its path and nothing else: no fill rule, no colour.
            expect(Object.keys(layer), name).toEqual(["d"]);
            expect(layer.d, name).toMatch(/^M[\d.\s\-MLHVACZz]+$/i);
        }
    }
});

test("glyph() emits two classed paths, no colour, aria-hidden", () => {
    for (const name of Object.keys(GLYPHS)) {
        const svg = glyph(name, 20);
        expect(
            svg.startsWith(
                `<svg class="gi gi-${name}" width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">`,
            ),
        ).toBe(true);
        const paths = [...svg.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
        expect(paths).toHaveLength(2);
        expect(paths[0]).toContain('class="ga"');
        expect(paths[1]).toContain('class="gb"');
        // The layers are coloured by class and token; an emitter that writes
        // a colour is exactly what CLAUDE.md forbids.
        expect(svg).not.toMatch(/\bfill=|\bstyle=|\bstroke=|#[0-9a-f]{3,6}\b/i);
    }
});

test("glyph() defaults to 17px, the smallest size anything ships at", () => {
    expect(glyph("flame")).toContain('width="17" height="17"');
    expect(glyph("nope")).toBe("");
});

// ---- tokens --------------------------------------------------------------

// The declarations of each of tokens.css's four theme blocks, by selector.
function block(open: RegExp): Map<string, string> {
    const m = open.exec(tokensCss);
    if (!m) throw new Error(`no block ${open}`);
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    for (; depth > 0; i++) {
        if (tokensCss[i] === "{") depth++;
        else if (tokensCss[i] === "}") depth--;
    }
    const body = tokensCss.slice(start, i - 1).replace(/\/\*[\s\S]*?\*\//g, "");
    return new Map(
        [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((d) => [
            d[1],
            d[2].trim(),
        ]),
    );
}
const BARE = block(/^:root \{/m);
const MEDIA_DARK = block(
    /@media \(prefers-color-scheme: dark\) \{\s*:root(?::not\(\[data-theme="light"\]\))? \{/,
);
const LIGHT = block(/^:root\[data-theme="light"\] \{/m);
const DARK = block(/^:root\[data-theme="dark"\] \{/m);
const THEMED = [MEDIA_DARK, LIGHT, DARK];

test("the four blocks are the ones that define the series tokens", () => {
    for (const b of [BARE, ...THEMED]) {
        for (const series of ["--cal", "--pro", "--wat", "--caf", "--panel"]) {
            expect(b.has(series)).toBe(true);
        }
    }
});

test("every --gl-* token is in all four blocks, or only on bare :root", () => {
    const names = new Set(
        [BARE, ...THEMED].flatMap((b) =>
            [...b.keys()].filter((k) => k.startsWith("--gl-")),
        ),
    );
    expect(names.size).toBeGreaterThan(0);
    for (const name of names) {
        const inThemed = THEMED.filter((b) => b.has(name)).length;
        // A theme-invariant value is declared once and nowhere else, so it
        // can never drift between copies; a themed one is in every copy.
        expect(BARE.has(name), name).toBe(true);
        expect([0, THEMED.length], name).toContain(inThemed);
    }
    // The light explicit block is a byte copy of bare :root's themed ones.
    for (const [name, value] of LIGHT) {
        if (name.startsWith("--gl-")) expect(BARE.get(name), name).toBe(value);
    }
    // Both dark copies agree.
    for (const [name, value] of DARK) {
        if (name.startsWith("--gl-"))
            expect(MEDIA_DARK.get(name), name).toBe(value);
    }
});

test("every shipped glyph's two layers resolve to a colour in both themes", () => {
    const resolve = (theme: Map<string, string>, name: string): string => {
        let value = theme.get(name) ?? BARE.get(name);
        for (let hop = 0; value && hop < 4; hop++) {
            const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
            if (!alias) break;
            value = theme.get(alias[1]) ?? BARE.get(alias[1]);
        }
        return value ?? "";
    };
    for (const name of SHIPPED) {
        for (const layer of ["a", "b"]) {
            const token = `--gl-${name}-${layer}`;
            // base.css hands the token to the layer through the drawing's class.
            expect(baseCss, token).toContain(
                `.gi-${name} {\n    --ga: var(--gl-${name}-a);\n    --gb: var(--gl-${name}-b);\n}`,
            );
            for (const theme of [BARE, MEDIA_DARK, LIGHT, DARK]) {
                expect(resolve(theme, token), token).toMatch(/^#[0-9a-f]{6}$/);
            }
        }
    }
});

// A glyph may borrow a series token only from its OWN metric: another metric's
// token on a tile puts that metric's identity where it does not belong. Any
// `var(--series)` counts, inside a color-mix() or a fallback as much as a bare
// alias, in the tokens and in base.css's `.gi-<name>` rules alike.
const SERIES = ["cal", "pro", "car", "fat", "wat", "fib", "sug", "caf", "alc"];
const OWN: Record<string, string> = {};
for (const m of macrosSrc.matchAll(
    /color: "c-([a-z]+)",\s*\n(?:[^\n]*\n){0,3}?\s*glyph: "([a-z]+)"/g,
)) {
    OWN[m[2]] = m[1];
}
const foreignSeries = (glyphName: string, text: string) =>
    [...text.matchAll(/var\(--([a-z]+)\b/g)]
        .map((v) => v[1])
        .filter((v) => SERIES.includes(v) && v !== OWN[glyphName]);

test("no glyph layer is painted with another metric's series token", () => {
    expect(Object.keys(OWN).length).toBeGreaterThanOrEqual(9);
    for (const theme of [BARE, MEDIA_DARK, LIGHT, DARK]) {
        for (const [name, value] of theme) {
            const g = /^--gl-([a-z]+)-[ab]$/.exec(name);
            if (g) expect(foreignSeries(g[1], value), name).toEqual([]);
        }
    }
    const rules = [...baseCss.matchAll(/\.gi-([a-z]+)\s*\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThanOrEqual(SHIPPED.length);
    for (const r of rules) expect(foreignSeries(r[1], r[2]), r[0]).toEqual([]);
});

// ---- the over state -----------------------------------------------------

// Every stylesheet that could reach a glyph: each shared partial (the over
// rules live in chip.css, not base.css) and every template's own <style>.
const TEMPLATES = "./public/widgets/src/templates";
const sheets: [string, string][] = [];
for (const f of new Bun.Glob("*.css").scanSync(SHARED)) {
    sheets.push([f, await Bun.file(`${SHARED}/${f}`).text()]);
}
for (const f of new Bun.Glob("*.html").scanSync(TEMPLATES)) {
    const html = await Bun.file(`${TEMPLATES}/${f}`).text();
    for (const m of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
        sheets.push([f, m[1]]);
    }
}
// Innermost rules only, so a rule nested in @media is still seen.
const cssRules = (css: string) =>
    [
        ...css
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .matchAll(/([^{};]+)\{([^{}]*)\}/g),
    ].map((m) => ({ selector: m[1].trim(), body: m[2] }));
const GLYPH_SELECTOR = /\.g[iab](?![\w-])|\.gi-[a-z]/;

test("no stylesheet recolours a glyph: an over state cannot turn it red", () => {
    const names = sheets.map(([f]) => f);
    expect(names).toContain("chip.css");
    expect(names).toContain("base.css");
    const allowedFill = new Map([
        [".gi .ga", "var(--ga, var(--ink2))"],
        [".gi .gb", "var(--gb, var(--ink2))"],
    ]);
    let seen = 0;
    for (const [file, css] of sheets) {
        for (const { selector, body } of cssRules(css)) {
            if (!GLYPH_SELECTOR.test(selector)) continue;
            seen++;
            const where = `${file}: ${selector}`;
            expect(body, where).not.toMatch(/var\(--c\b/);
            for (const d of body.matchAll(/(^|;)\s*([a-z-]+)\s*:\s*([^;]+)/g)) {
                const [prop, value] = [d[2], d[3].trim()];
                if (!["fill", "color", "stroke"].includes(prop)) continue;
                expect(
                    file === "base.css" && allowedFill.get(selector) === value,
                    `${where} sets ${prop}: ${value}`,
                ).toBe(true);
            }
        }
    }
    // chip.css's sizing rules and base.css's paint rules, at the least
    expect(seen).toBeGreaterThan(15);
});
