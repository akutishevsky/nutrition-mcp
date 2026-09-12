// The landing page ships a mechanically-scoped copy of the widget's real CSS
// partials, so the cards on /  are the cards in chat rather than a hand-drawn
// approximation of them. These tests pin the two things that transform has to
// get right and that nothing else would notice going wrong:
//
//   1. NOTHING LEAKS. A stylesheet built for a deny-all iframe sets the type
//      scale on `body` and the whole palette on `:root`. Dropped onto the
//      public site unchanged it would reset the page to 13.5px system-sans.
//      Every assertion about `:root`, `body`, `html` and `*` below is there
//      because the un-transformed source really does contain that rule.
//   2. NOTHING IS LOST. The four partials are mutually entangled (chip.css
//      overrides chart.css's `.fspark .cline`; chart.css draws inside
//      chip.css's `.fspark`), so the transform is whole-file and assertive
//      rather than a subset — and the representative selectors at the bottom
//      are the tripwire for a "clever" narrowing of it later.
//
// Most of it runs on the real partials, because a synthetic fixture cannot
// tell you that `.strip.tiered .fmeta, .focus.solo .fmeta` survived. The
// hand-written fixtures cover the shapes the sources happen not to contain
// yet (a comma inside `:not()`, a `body` descendant rule) so the transform is
// pinned against the next edit to a partial, not only against today's text.
import { test, expect } from "bun:test";
import {
    CARD_MAX_WIDTH,
    CARD_TEMPLATES,
    CONTAINER_NAME,
    NARROW_FALLBACK_PX,
    SCOPE,
    assertNoGlobalCollisions,
    customPropertyNames,
    globalNamesOf,
    readCardTemplateCss,
    readWidgetCssSource,
    scopeSelector,
    scopeWidgetCss,
    splitTemplateCss,
    splitTopLevel,
    stripComments,
    templateScope,
    transformWidgetCss,
} from "./widget-css";
import { WIDGET_TEMPLATES } from "./widgets";

const SOURCE = await readWidgetCssSource();
const TEMPLATES = await readCardTemplateCss();
const RESULT = transformWidgetCss(SOURCE, { templates: TEMPLATES });
const CSS = RESULT.css;
const SITE_CSS = await Bun.file("./public/styles.css").text();

/** Every selector list in the output: anything before a `{` that is not an
 *  at-rule prelude and not a keyframe step. The output is generated, so one
 *  selector list per `{` holds by construction. */
function selectorLists(css: string): string[] {
    const keyframeBodies = [
        ...css.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\}/g),
    ]
        .map((m) => m[1]!)
        .join("\n");
    return [...css.matchAll(/(?:^|\n)[ ]*([^\n{}@][^{}]*?)\s*\{/g)]
        .map((m) => m[1]!.replace(/\n\s*/g, "\n").trim())
        .filter((s) => s && !keyframeBodies.includes(`${s} {`));
}

/* --------------------------------------------------------------- 1. leaks */

test("the source really does carry the leaks this transform exists to stop", () => {
    // If these stop being true the transform is solving a problem that moved,
    // and the assertions below would pass vacuously.
    expect(SOURCE).toContain(":root {");
    expect(SOURCE).toContain(':root[data-theme="dark"] {');
    expect(SOURCE).toMatch(/\bhtml,\s*\n\s*body\s*\{/);
    expect(SOURCE).toMatch(/^body \{/m);
    expect(SOURCE).toContain("font-size: 13.5px");
    expect(SOURCE).toMatch(/@media \(min-width: 580px\)/);
});

test("no bare :root survives anywhere in the output", () => {
    expect(CSS).not.toContain(":root");
});

test("no rule can match outside the card", () => {
    for (const list of selectorLists(CSS)) {
        for (const sel of splitTopLevel(list)) {
            expect(sel).toContain(SCOPE);
            // A `body` lead is allowed only as one of the three theme
            // anchors, which are `body… .nm-widget-card` and so still cannot
            // paint anything outside the card.
            if (/^(?:html|body|\*)/.test(sel)) {
                expect(sel).toMatch(
                    /^body(?:\[data-theme="(?:light|dark)"\]|:not\(\[data-theme="light"\]\)) \.nm-widget-card(?=$|[\s>+~])/,
                );
            }
        }
    }
});

test("the universal box-sizing and reduced-motion rules are dropped, and reported", () => {
    expect(CSS).not.toMatch(/(^|\n)\s*\*[,\s]/);
    expect(CSS).not.toContain("box-sizing: border-box");

    const universals = RESULT.droppedUniversals;
    expect(universals).toHaveLength(2);

    const box = universals.find((d) => d.at === "top level");
    expect(box?.selectors).toEqual(["*", "*::before", "*::after"]);
    expect(box?.declarations).toEqual(["box-sizing: border-box"]);

    // The reduced-motion one is dropped in favour of the site's own block —
    // but the site's does NOT carry `animation-delay`, and every entrance in
    // chip.css is staggered with `animation-delay` + `animation-fill-mode:
    // both`. Pinned here so the day the widget adds another declaration the
    // site lacks, somebody has to look at it.
    const motion = universals.find((d) => d.at.includes("reduced-motion"));
    expect(motion?.declarations).toContain("animation-delay: 0s !important");
    expect(motion?.declarations).toEqual([
        "animation-duration: 0.01ms !important",
        "animation-iteration-count: 1 !important",
        "transition-duration: 0.01ms !important",
        "animation-delay: 0s !important",
    ]);

    // …and the SCOPABLE half of that media block is kept: the drawer's
    // un-hide is the one rule there that must not depend on the site.
    expect(CSS).toMatch(
        /@media \(prefers-reduced-motion: reduce\) \{\n\s*\.nm-widget-card \.drawer \{/,
    );
});

test("the leak assertion throws, naming the offending text", () => {
    expect(() => scopeWidgetCss(":root { --x: 1; }\n")).not.toThrow();
    // A selector shape the scoper does not understand must fail loudly rather
    // than being prefixed into something that silently matches nothing.
    expect(() => scopeWidgetCss(".a :root .b { color: red; }")).toThrow(
        /:root/,
    );
    expect(() => scopeWidgetCss("@font-face { src: local(x); }")).toThrow(
        /@font-face/,
    );
    expect(() =>
        scopeWidgetCss(
            "@media (min-width: 40px) and (prefers-contrast: more) { .a { color: red } }",
        ),
    ).toThrow(/container query/);
});

/* ------------------------------------------------------------- 2. hoisting */

test("@property --p is hoisted to top level, unchanged", () => {
    // Unscopable and load-bearing: without the registration chip.css's wash
    // keyframe snaps from 0% to the value instead of sweeping.
    expect(CSS).toMatch(/^@property --p \{$/m);
    const idx = CSS.indexOf("@property --p");
    expect(idx).toBeGreaterThan(-1);
    // Top level = no indentation, and nothing open around it.
    expect(CSS.slice(0, idx).split("{").length).toBe(
        CSS.slice(0, idx).split("}").length,
    );
    expect(CSS).toContain('syntax: "<percentage>"');
    expect(CSS).toContain("inherits: false");
    expect(CSS).toContain("initial-value: 0%");
});

test("the scope rule leads the file and carries .wrap's own cap", () => {
    expect(CSS.startsWith(`${SCOPE} {\n`)).toBe(true);
    expect(CSS).toContain("container-type: inline-size");
    expect(CSS).toContain(`container-name: ${CONTAINER_NAME}`);
    expect(CSS).toContain(`max-width: ${CARD_MAX_WIDTH}`);
    // The cap is the one the container queries were measured against; the
    // transform re-checks it against the real `.wrap` rule.
    expect(SOURCE).toMatch(/\.wrap \{[^}]*max-width: 760px/s);
});

/* ---------------------------------------------------------- 3. theme remap */

test("the four theme anchors map onto the site's body-stamped data-theme", () => {
    // The site stamps data-theme on <body> (public/site.js); the widget stamps
    // it on the root element. Left alone, the explicit dark toggle would never
    // match and a dark page would carry a light card with nothing failing.
    expect(CSS).toMatch(/(^|\n)\.nm-widget-card \{\n\s*--bg: #f7f7f9;/);
    expect(CSS).toContain('body[data-theme="light"] .nm-widget-card {');
    expect(CSS).toContain('body[data-theme="dark"] .nm-widget-card {');
    expect(CSS).toMatch(
        /@media \(prefers-color-scheme: dark\) \{\n\s*body:not\(\[data-theme="light"\]\) \.nm-widget-card \{/,
    );
});

test("the two theme-conditional pairs inside chart.css and chip.css map too", () => {
    // chart.css's .cwrap --cstroke and chip.css's .fra stroke: the only rules
    // outside tokens.css that are written per theme.
    expect(CSS).toContain(
        'body:not([data-theme="light"]) .nm-widget-card .cwrap {',
    );
    expect(CSS).toContain('body[data-theme="dark"] .nm-widget-card .cwrap {');
    expect(CSS).toContain(
        'body:not([data-theme="light"]) .nm-widget-card .fra {',
    );
    expect(CSS).toContain('body[data-theme="dark"] .nm-widget-card .fra {');
    // Eight :root anchors in the source — tokens.css's four theme blocks plus
    // these two pairs — and all eight are accounted for above. A ninth added
    // to a partial shows up here before it shows up as an un-themed card.
    expect(stripComments(SOURCE).match(/:root/g)?.length).toBe(8);
});

test("scopeSelector maps each anchor exactly as specified", () => {
    expect(scopeSelector(":root", false)).toBe(SCOPE);
    expect(scopeSelector(":root", true)).toBe(
        `body:not([data-theme="light"]) ${SCOPE}`,
    );
    expect(scopeSelector(':root[data-theme="light"]', false)).toBe(
        `body[data-theme="light"] ${SCOPE}`,
    );
    expect(scopeSelector(':root[data-theme="dark"]', false)).toBe(
        `body[data-theme="dark"] ${SCOPE}`,
    );
    expect(scopeSelector(':root:not([data-theme="light"]) .cwrap', true)).toBe(
        `body:not([data-theme="light"]) ${SCOPE} .cwrap`,
    );
});

/* ------------------------------------------------------------- 4. the type */

test("base.css's html/body reset lands on the card, font stack included", () => {
    // Every tile-fit measurement in chip.css was taken at 13.5px/1.4/500 on
    // the system stack. The card must not inherit Urbanist.
    const bodyRule =
        /(^|\n)\.nm-widget-card \{\n([^}]*font-size: 13\.5px[^}]*)\}/.exec(CSS);
    expect(bodyRule).not.toBeNull();
    const decls = bodyRule![2]!;
    expect(decls).toContain("font-family: var(--font)");
    expect(decls).toContain("line-height: 1.4");
    expect(decls).toContain("font-weight: 500");
    expect(decls).toContain("letter-spacing: -0.005em");
    expect(decls).toContain("color: var(--ink)");
    expect(decls).toContain("background: var(--bg)");
    // …and `html, body { margin: 0; padding: 0 }` collapsed to one card rule
    // rather than two identical ones.
    expect(CSS).toMatch(
        /\.nm-widget-card \{\n\s*margin: 0;\n\s*padding: 0;\n\}/,
    );
    expect(CSS).not.toMatch(/\.nm-widget-card,\n\.nm-widget-card \{/);
});

/* ------------------------------------------------- 5. container conversion */

test("every width @media became a @container, and the colour/motion ones did not", () => {
    expect(CSS).not.toMatch(/@media[^{]*width/i);

    // The five card-width thresholds chip.css measures against.
    expect(RESULT.containerQueries).toEqual([
        "(min-width: 580px)",
        "(max-width: 479px)",
        "(min-width: 480px) and (max-width: 619px)",
        "(max-width: 401px)",
        "(max-width: 479px)",
        "(max-width: 419.98px)",
    ]);
    expect([
        ...CSS.matchAll(new RegExp(`@container ${CONTAINER_NAME} `, "g")),
    ]).toHaveLength(RESULT.containerQueries.length);

    // …and the three non-width conditions stay real media queries: a
    // container query cannot ask about the user's colour scheme or motion
    // preference.
    expect(new Set(RESULT.mediaQueries)).toEqual(
        new Set([
            "(prefers-color-scheme: dark)",
            "(prefers-reduced-motion: reduce)",
        ]),
    );
    expect(RESULT.mediaQueries).toHaveLength(5);
});

test("the @supports tail pins the narrow layout for pre-container engines", () => {
    // A pre-2023 engine drops every @container block, which takes the
    // max-width overrides with it — and `.strip.tiered .rail[data-n="4"]`
    // defaults to FOUR across. Replaying the blocks that hold at a narrow card
    // is what stops that becoming four clipped tiles.
    expect(CSS).toContain("@supports not (container-type: inline-size) {");
    expect(RESULT.narrowFallbackQueries).toEqual([
        "(max-width: 479px)",
        "(max-width: 401px)",
        "(max-width: 479px)",
        "(max-width: 419.98px)",
    ]);
    // No min-width block is replayed: at NARROW_FALLBACK_PX they are all false.
    expect(NARROW_FALLBACK_PX).toBeLessThan(401);
    for (const q of RESULT.narrowFallbackQueries) {
        expect(q).not.toContain("min-width");
    }
    // The rule that actually rescues the 4-across default, at (0,5,0) so it
    // outranks the unqueried `.strip.tiered .rail[data-n="4"]` at (0,4,0).
    const tail = CSS.slice(CSS.indexOf("@supports not (container-type"));
    expect(tail).toContain(
        '.nm-widget-card .strip.tiered .rail:not(.r-macro)[data-n="4"]',
    );
    expect(tail).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    // Last in the file, so at equal specificity it wins exactly as the
    // max-width block it came from does in the source.
    expect(CSS.trimEnd().endsWith("}")).toBe(true);
    expect(CSS.indexOf("@supports")).toBeGreaterThan(
        CSS.lastIndexOf("@container"),
    );
});

/* -------------------------------------------------------- 6. keyframe steps */

test("keyframe steps are left unprefixed", () => {
    for (const name of [
        "tileIn",
        "washIn",
        "ringIn",
        "drawIn",
        "fadeIn",
        "rowIn",
        "rise",
    ]) {
        expect(CSS).toContain(`@keyframes ${name} {`);
    }
    const blocks = [...CSS.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n\}/g)];
    expect(blocks).toHaveLength(7);
    for (const b of blocks) {
        expect(b[1]).not.toContain(SCOPE);
        for (const m of b[1]!.matchAll(/\n\s{4}([^\n{}]+)\{/g)) {
            expect(m[1]!.trim()).toMatch(/^(?:from|to|[\d.]+%)$/);
        }
    }
    // The registered property is what makes washIn interpolate at all.
    expect(CSS).toMatch(/@keyframes washIn \{\n\s*from \{\n\s*--p: 0%;/);
});

/* ------------------------------------------- 7. selector-splitting hazards */

test("a comma inside :not()/:is()/:where() is never split on", () => {
    expect(splitTopLevel(".a:not(.b, .c), .d")).toEqual([
        ".a:not(.b, .c)",
        ".d",
    ]);
    expect(splitTopLevel(':is(h1, h2) .x, .y[data-a="p,q"]')).toEqual([
        ":is(h1, h2) .x",
        '.y[data-a="p,q"]',
    ]);
    const out = scopeWidgetCss(
        ":where(.a, .b) .c, .d:not(.e, .f) { color: red; }",
    );
    expect(out).toContain(`${SCOPE} :where(.a, .b) .c`);
    expect(out).toContain(`${SCOPE} .d:not(.e, .f)`);
    expect(out).not.toContain(`${SCOPE} .b)`);
    // …and a value comma is not a selector comma either.
    expect(
        scopeWidgetCss(".a { grid-template-columns: repeat(2, 1fr); }"),
    ).toContain("repeat(2, 1fr)");
});

test("a leading body/html is rescoped rather than prefixed", () => {
    // `.nm-widget-card body .x` would match nothing; the card IS the body
    // here, so the anchor is replaced, not prepended to.
    expect(scopeWidgetCss("body .x { color: red; }")).toContain(
        `${SCOPE} .x {`,
    );
    expect(scopeWidgetCss("body .x { color: red; }")).not.toContain("body .x");
    expect(scopeWidgetCss("html, body { margin: 0; }")).toContain(
        `${SCOPE} {\n    margin: 0;\n}`,
    );
    expect(scopeWidgetCss("body > .card { padding: 0; }")).toContain(
        `${SCOPE} > .card {`,
    );
});

/* -------------------------------------------------- 8. comments and volume */

test("comments are stripped, strings and apostrophes survive", () => {
    // Comments in these partials contain braces (`[hidden] { display: none }`)
    // and apostrophes ("the host's setting"), both of which naive stripping
    // gets wrong — the first by desyncing the brace parser, the second by
    // opening a string that swallows the rest of the file.
    expect(stripComments("a/*x*/b")).toBe("a b");
    expect(stripComments("/* the host's `{` */ .a { content: '/*'; }")).toBe(
        "  .a { content: '/*'; }",
    );
    expect(CSS).not.toContain("/*");
    expect(CSS).not.toContain("*/");
    expect(CSS).toContain('content: ""');
    expect(CSS).toContain('"Segoe UI"');
    // ~80% of the source is commentary; what ships should be a fraction of it.
    expect(CSS.length).toBeLessThan(SOURCE.length * 0.45);
});

/* --------------------------------------- 9. representative surviving rules */

test("representative rules from each partial survive intact", () => {
    // tokens.css — the AA-corrected values, and color-scheme in all four
    // blocks (without it a dark card renders light OS chrome).
    expect(CSS).toContain("--acc: #15803d");
    expect(CSS).toContain("--sug: #657f18");
    expect(CSS).toContain("--alc: #e879f9");
    expect([...CSS.matchAll(/color-scheme: (?:light|dark);/g)]).toHaveLength(4);

    // base.css — the card, the flat outermost card, the nutrient role classes,
    // the settings note bridge.js appends.
    expect(CSS).toContain(`${SCOPE} .card {`);
    expect(CSS).toContain(`${SCOPE} .wrap > .card {`);
    expect(CSS).toContain(`${SCOPE} .wrap:not(.page) > .empty {`);
    expect(CSS).toContain(`${SCOPE} .c-cal {`);
    expect(CSS).toContain(`${SCOPE} .wnote {`);
    expect(CSS).toContain(`${SCOPE} .card > :not(.glow) {`);

    // chip.css — including the two grouped selectors that cross primitive
    // boundaries, which a per-primitive subset of this file would have lost.
    expect(CSS).toContain(`${SCOPE} .strip.tiered .fmeta`);
    expect(CSS).toContain(`${SCOPE} .focus.solo .fmeta`);
    expect(CSS).toMatch(
        /\.nm-widget-card \.strip\.tiered \.fmeta,\n\.nm-widget-card \.focus\.solo \.fmeta \{/,
    );
    expect(CSS).toContain(
        `${SCOPE} button.focus:not([aria-expanded="true"]):not([aria-pressed="true"]):hover {`,
    );
    expect(CSS).toContain(`${SCOPE} .drawer:focus-visible {`);

    // chart.css — the grouped marker pair, and the chip.css override that only
    // works because chart.css's own `.cline` is still in the file.
    expect(CSS).toMatch(
        /\.nm-widget-card \.chalo,\n\.nm-widget-card \.cdot \{/,
    );
    expect(CSS).toContain(`${SCOPE} .fspark .cpt {`);
    expect(CSS).toContain(`${SCOPE} .cline {`);
    expect(CSS).toContain(`${SCOPE} .cfoot .u {`);
});

test("the transform is deterministic", () => {
    expect(transformWidgetCss(SOURCE, { templates: TEMPLATES }).css).toBe(CSS);
});

/* --------------------------------------------- 10. a template's own rules */

// WIDGET_CSS_PARTIALS is four shared files, but a card template's <style> is
// those four AND anything it adds after them — trends.html owns `#tr-body`.
// Those rules shipped nowhere until the sheet started lifting them out, and
// nothing failed: `.card` is a column flex container so `min-width: auto`
// already resolved to 0, and the range-empty foot is unreachable from the
// landing payload. The NEXT one would have been the one that bit.

test("the card templates really do carry rules of their own", () => {
    // Vacuity guard for everything below. If trends.html ever stops owning
    // rules, these tests would pass on an empty set.
    const trends = TEMPLATES.find((t) => t.key === "trends");
    expect(trends?.css).toContain("#tr-body");
    expect(TEMPLATES.map((t) => t.key)).toEqual([...CARD_TEMPLATES]);
});

test("a template's own rules reach the sheet, scoped to its own card", () => {
    expect(RESULT.templateRules).toEqual([
        { key: "nutrition-summary", selectors: [] },
        {
            key: "trends",
            selectors: [
                `${templateScope("trends")} #tr-body`,
                `${templateScope("trends")} #tr-body > .foot`,
            ],
        },
    ]);
    expect(CSS).toMatch(
        new RegExp(
            `${templateScope("trends").replace(/[.[\]()"?*+^$|\\]/g, "\\$&")} #tr-body \\{\\n\\s*min-width: 0;\\n\\}`,
        ),
    );
    expect(CSS).toContain(
        `${templateScope("trends")} #tr-body > .foot {\n    margin-top: 10px;\n}`,
    );
});

test("the narrowing is free, and lands where the template put it", () => {
    // :where() carries ZERO specificity, so a template rule ranks exactly as
    // it would under the bare scope — one class heavier than the iframe's,
    // which is the same one class every shared rule gained. Anything else
    // would reorder template rules against shared ones on the page only.
    expect(templateScope("trends")).toBe(
        `${SCOPE}:where([data-widget="trends"])`,
    );
    // After the shared partials (as in the template, where the rules follow
    // the @includes) and before the pre-container tail, which stays last.
    expect(CSS.indexOf("#tr-body")).toBeGreaterThan(CSS.lastIndexOf(".cfoot"));
    expect(CSS.indexOf("#tr-body")).toBeLessThan(CSS.indexOf("@supports"));
});

test("CARD_TEMPLATES matches the generator's list", async () => {
    // Two lists, one fact: this file decides whose CSS ships, gen-widget-card
    // decides whose JS does. A card with behaviour and no layout is the
    // half-shipped state the whole design is built to avoid.
    const gen = await Bun.file("./scripts/gen-widget-card.ts").text();
    const body = /const CARD_TEMPLATES = \[([^\]]*)\]/.exec(gen)?.[1];
    expect(
        body,
        "scripts/gen-widget-card.ts declares CARD_TEMPLATES",
    ).toBeTruthy();
    const files = [...body!.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(files).toEqual(CARD_TEMPLATES.map((k) => WIDGET_TEMPLATES[k]));
});

test("splitTemplateCss refuses a template the sheet cannot serve", () => {
    const head = (body: string) =>
        `<html><head><style>${body}</style></head><body></body></html>`;
    const includes = [
        "/*@include shared/tokens.css@*/",
        "/*@include shared/base.css@*/",
        "/*@include shared/chip.css@*/",
        "/*@include shared/chart.css@*/",
    ].join("\n");

    expect(splitTemplateCss(head(includes), "ok.html").own).toBe("");
    expect(
        splitTemplateCss(head(`${includes}\n#x { color: red; }`), "ok.html")
            .own,
    ).toContain("#x");
    // Comments only — the template adds nothing, and must not be reported as
    // if it did.
    expect(
        splitTemplateCss(
            head(`${includes}\n/* nothing of its own */`),
            "c.html",
        ).own,
    ).toBe("");
    // A partial the sheet is not built from: the page's card would be styled
    // by a different stylesheet than the iframe's.
    expect(() =>
        splitTemplateCss(
            head(`${includes}\n/*@include shared/form.css@*/`),
            "x.html",
        ),
    ).toThrow(/shared\/form\.css/);
    // …and the same four in the wrong order, which is a real difference:
    // several rules in chip.css only win by coming after chart.css.
    expect(() =>
        splitTemplateCss(
            head(
                [
                    "/*@include shared/tokens.css@*/",
                    "/*@include shared/chip.css@*/",
                    "/*@include shared/base.css@*/",
                    "/*@include shared/chart.css@*/",
                ].join("\n"),
            ),
            "y.html",
        ),
    ).toThrow(/order matters/);
    expect(() => splitTemplateCss("<html></html>", "z.html")).toThrow(
        /no <style> region/,
    );
});

/* ------------------------------------------ 11. the document-global names */

// Everything above proves no SELECTOR escapes the card. Two things in this
// sheet are not selectors: `@keyframes` names and `@property` registrations
// are document-scoped, and /widget-card.css loads AFTER /styles.css — so a
// name shared with the site silently redefines the site's animation or types
// the site's custom property page-wide, with every other gate green.

test("the sheet's document-global names are the ones we think they are", () => {
    const mine = globalNamesOf(CSS);
    expect(mine.keyframes).toEqual([
        "tileIn",
        "washIn",
        "ringIn",
        "drawIn",
        "fadeIn",
        "rowIn",
        "rise",
    ]);
    expect(mine.properties).toEqual(["--p"]);
});

test("no global name collides with the site's own stylesheet", () => {
    // Vacuity guard: the site really does claim both name spaces, so the
    // comparison below is comparing against something.
    const theirs = globalNamesOf(SITE_CSS);
    expect(theirs.keyframes.length).toBeGreaterThan(5);
    expect(customPropertyNames(SITE_CSS).size).toBeGreaterThan(20);
    // Today's gap is naming convention alone — every site keyframe is
    // `nm-`-prefixed and the site never uses `--p` — and a convention is not
    // a gate. This is.
    expect(() => assertNoGlobalCollisions(CSS, SITE_CSS)).not.toThrow();
});

test("a collision in either name space fails the build", () => {
    expect(() =>
        assertNoGlobalCollisions(
            CSS,
            "@keyframes fadeIn { from { opacity: 0 } }",
        ),
    ).toThrow(/@keyframes fadeIn/);
    // A registered property clashes with mere USE, not only with another
    // registration: registering types the name for the whole document.
    expect(() =>
        assertNoGlobalCollisions(CSS, ".x { width: var(--p); }"),
    ).toThrow(/@property --p/);
    expect(() => assertNoGlobalCollisions(CSS, ".x { --p: 4px; }")).toThrow(
        /@property --p/,
    );
    // A name that merely starts the same is not a collision.
    expect(() =>
        assertNoGlobalCollisions(CSS, ".x { width: var(--progress); }"),
    ).not.toThrow();
    expect(() =>
        assertNoGlobalCollisions(CSS, "@keyframes fadeInSlow { from {} }"),
    ).not.toThrow();
    // A mention inside a comment is not a definition.
    expect(() =>
        assertNoGlobalCollisions(CSS, "/* @keyframes fadeIn and var(--p) */"),
    ).not.toThrow();
});

/* ------------------------------------- 12. the one site rule that reached in */

// The site's element defaults are the only thing in styles.css that cascades
// into the scoped card, and `:where(body) svg { max-width: 100% }` really did:
// a full getComputedStyle walk found every SVG in the page card capped at its
// box where the chat widget's is not. Nothing moved, because each of them is
// already narrower than its container — the first one that is not would be
// clipped on the page and correct in chat.

test("the page's element defaults are a closed list, cancelled where they reach in", () => {
    const defaults = [
        ...new Set(
            [
                ...stripComments(SITE_CSS).matchAll(
                    /:where\(body\)\s+([a-zA-Z*]+)\s*[,{]/g,
                ),
            ].map((m) => m[1]!),
        ),
    ].sort();
    expect(
        defaults,
        "a new page-wide element default was added to public/styles.css — decide whether it must be cancelled inside .nm-widget-card (the card carries the widget's own complete stylesheet), then update this list",
    ).toEqual(["*", "a", "button", "code", "img", "main", "svg"]);

    // `*` stays: the widget's own `* { box-sizing: border-box }` is dropped as
    // unscopable precisely because the site already ships it.
    expect(RESULT.droppedUniversals[0]?.declarations).toEqual([
        "box-sizing: border-box",
    ]);
    // img/svg is the one that had to be cancelled, and it is cancelled with a
    // zero-specificity inner list so any widget rule still wins.
    expect(SITE_CSS).toContain(
        `${SCOPE} :where(img, svg) {\n    max-width: none;\n}`,
    );
});
