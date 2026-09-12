/* Turns the widget's four shared CSS partials — plus each card template's own
   handful of rules — into ONE stylesheet the public site can load, in which
   every declaration applies only inside `.nm-widget-card` and nothing reaches
   the page around it.

   WHY A TRANSFORMER AND NOT A HAND-WRITTEN COPY. The landing page shows real
   widget cards, rendered at build time by the real emitters, so the markup is
   byte-identical to chat by construction. A hand-ported stylesheet would make
   the CSS the one half that drifts — and it would drift silently, because the
   page keeps rendering. Running the real partials through a transform means a
   change to `shared/chip.css` reaches the landing page on the next build, and
   the assertions at the bottom of this file turn the one class of change that
   CANNOT be shipped (a rule that escapes the card) into a build failure.

   The seven transforms that are decisions rather than mechanics:

     THEME. The widget stamps `data-theme` on the ROOT element; the site stamps
     it on `<body>` (public/site.js). `:root[data-theme="dark"]` therefore can
     never match on the site, and the explicit dark toggle would have left a
     light card on a dark page with nothing failing. Every `:root` anchor is
     remapped onto the site's mechanism — see `scopeSelector`.

     TYPE. base.css's `html, body` and `body` rules are rescoped onto the card
     rather than dropped, font stack included. Every tile-fit measurement in
     chip.css was taken at 13.5px/1.4/500/-0.005em on the system stack; letting
     the card inherit Urbanist would invalidate all of them. (The old
     hand-drawn mock set `font-family: system-ui` for exactly this reason.)

     WIDTH. Every width `@media` becomes a `@container nmdawn` query. This is a
     correction, not a workaround: 580/480/620/402/420 were always CARD widths
     — true inside the iframe, false on the site, where the card is ~450px at
     any desktop viewport and a viewport query would render four tiles at
     ~105px, under the 109.5px chip.css's own comment records as the measured
     clipping failure.

     GLOBALS. The `*` box-sizing block and the `*` reduced-motion block are
     dropped: they are unscopable by definition and the site already ships
     both. NOTE FOR public/styles.css: the widget's reduced-motion block also
     carries `animation-delay: 0s !important`, which the site's does not. Every
     entrance here is staggered with `animation-delay` plus
     `animation-fill-mode: both`, which holds a tile at its `from` — invisible
     — until the delay elapses; killing the duration alone leaves the last tile
     blank for a third of a second on a machine that asked for no motion.

     PRE-CONTAINER ENGINES. `@container` is unknown to a pre-2023 engine, which
     drops the whole block — so the min-width blocks vanish (fine) and the
     max-width blocks vanish too (not fine: `.strip.tiered .rail[data-n="4"]`
     defaults to FOUR across). The `@supports not (container-type: inline-size)`
     tail replays every container block that holds at a narrow card, pinning
     the narrow layout there instead.

     TEMPLATE RULES. A card template's `<style>` is the four `@include`s AND,
     sometimes, a rule or two of its own (trends.html owns `#tr-body`). Those
     reach the iframe and must reach the page too, or the next one added ships
     nowhere and nothing fails — so `readCardTemplateCss` lifts each template's
     own rules out and they are transformed here, after the shared partials,
     exactly as the template puts them after its `@include`s. Each template's
     block is narrowed to ITS OWN card with `:where([data-widget="<key>"])`,
     because the landing page holds two cards in one document and in chat a
     template's rules can only ever see its own: `:where()` carries zero
     specificity, so the narrowing is free and every rule in the sheet — shared
     or template — is still exactly one class heavier than its source, which is
     what keeps the cascade between them identical to chat's.

     DOCUMENT-GLOBAL NAMES. Two things in this stylesheet cannot be scoped by
     any selector rewriting: `@keyframes` names and `@property` registrations
     are document-scoped, and /widget-card.css loads AFTER /styles.css. A
     `@keyframes fadeIn` here would silently redefine a `fadeIn` there, and a
     `@property --p` would type the site's own `--p` page-wide — with no rule
     matching outside the card and every other assertion in this file green.
     Renaming them is not an option worth its cost (every `animation:`
     shorthand and every `var(--p)` in the partials would have to be rewritten
     in step), so `assertNoGlobalCollisions` compares the emitted names against
     public/styles.css and fails the build on an overlap.

   The transform is a pure string -> string function so it unit-tests without
   touching disk; `buildWidgetCardCss()` at the bottom is the thin disk wrapper
   the generator calls, and the one place that reads the templates and the
   site's own stylesheet. */

import { readSrc, WIDGET_TEMPLATES } from "./widgets.js";

/** The one class every rule in the output hangs off. */
export const SCOPE = ".nm-widget-card";

/** The container name the converted width queries resolve against. */
export const CONTAINER_NAME = "nmdawn";

/** `.wrap`'s own cap, lifted onto the scope so the card measures what the
 *  container queries were written against. Asserted against the real `.wrap`
 *  rule in the transformed output — a change there fails the build. */
export const CARD_MAX_WIDTH = "760px";

/** The card width the `@supports` fallback pins. A real phone, and narrow
 *  enough to satisfy every max-width block in chip.css (401 is the tightest). */
export const NARROW_FALLBACK_PX = 360;

/** Source order matters: it is the order every template `@include`s them in
 *  (see public/widgets/src/templates/*.html), and several rules in chip.css
 *  and chart.css only win by coming after each other. */
export const WIDGET_CSS_PARTIALS = [
    "tokens.css",
    "base.css",
    "chip.css",
    "chart.css",
] as const;

/** The widget keys whose cards the landing page ships, in the order their
 *  own rules are appended to the sheet.
 *
 *  MUST match CARD_TEMPLATES in scripts/gen-widget-card.ts — that list decides
 *  which templates' JS partials the runtime bundles, this one which templates'
 *  CSS the stylesheet carries, and a card whose behaviour ships without its
 *  layout is exactly the half-shipped state this file exists to prevent.
 *  src/widget-css.test.ts pins the two against each other. */
export const CARD_TEMPLATES = ["nutrition-summary", "trends"] as const;

/** How one card template's own rules are narrowed to that card.
 *
 *  `:where()` contributes NOTHING to specificity, so `.nm-widget-card:where(
 *  [data-widget="trends"]) #tr-body` ranks exactly as `.nm-widget-card
 *  #tr-body` would — one class heavier than the `#tr-body` the iframe sees,
 *  which is the same one class every shared rule gained. The attribute is the
 *  one the generator stamps on the scope element (widgetCardBlock in
 *  scripts/gen-index.ts). */
export function templateScope(widgetKey: string): string {
    return `${SCOPE}:where([data-widget="${widgetKey}"])`;
}

/** A rule the transform removed because it could not be scoped. Surfaced so a
 *  caller can report what now has to live in the site's own stylesheet. */
export interface DroppedRule {
    /** The at-rule it sat in, or "top level". */
    at: string;
    selectors: string[];
    declarations: string[];
}

/** One card template's own CSS — its `<style>` with the `@include` markers
 *  taken out, which is everything the template adds on top of the shared
 *  partials. `css` is "" for a template that adds nothing. */
export interface TemplateCss {
    /** The widget key, which is also the `data-widget` value it is scoped to. */
    key: string;
    css: string;
}

export interface TransformOptions {
    /** Card templates' own rules, appended after the shared partials in the
     *  order given and scoped to their own card — see templateScope. */
    templates?: readonly TemplateCss[];
}

export interface TransformResult {
    css: string;
    /** The selectors each template's own rules landed on, per template key.
     *  Empty for a template that contributes nothing. */
    templateRules: { key: string; selectors: string[] }[];
    /** `*` rules that were dropped, with their declarations. */
    droppedUniversals: DroppedRule[];
    /** Conditions of each `@media` that became a `@container`, in order. */
    containerQueries: string[];
    /** The subset of those replayed in the `@supports` fallback. */
    narrowFallbackQueries: string[];
    /** Conditions left as real `@media` (colour scheme, reduced motion). */
    mediaQueries: string[];
}

/* ------------------------------------------------------------------ parsing */

type Decl = { kind: "decl"; text: string };
type Rule = { kind: "rule"; prelude: string; body: Node[] };
type AtRule = {
    kind: "at";
    name: string;
    prelude: string;
    body: Node[] | null;
};
type Node = Decl | Rule | AtRule;

/** Collapse every whitespace run to one space — but only outside strings, or
 *  `content: "a  b"` and a two-space font name would be rewritten. */
function collapse(input: string): string {
    let out = "";
    let quote: string | null = null;
    for (let i = 0; i < input.length; i++) {
        const c = input[i]!;
        if (quote) {
            out += c;
            if (c === "\\") {
                out += input[i + 1] ?? "";
                i++;
            } else if (c === quote) quote = null;
            continue;
        }
        if (c === '"' || c === "'") {
            quote = c;
            out += c;
            continue;
        }
        if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
            if (out.length > 0 && !out.endsWith(" ")) out += " ";
            continue;
        }
        out += c;
    }
    return out.trim();
}

/** Strip CSS comments. String-aware in both directions: a comment may hold an
 *  apostrophe ("the host's setting") and a string may hold a comment opener,
 *  and these partials contain the first on nearly every line. A comment may
 *  also hold braces (`[hidden] { display: none }` in chip.css), which is why
 *  this has to run before the brace parser rather than beside it. */
export function stripComments(css: string): string {
    let out = "";
    let quote: string | null = null;
    let i = 0;
    while (i < css.length) {
        const c = css[i]!;
        if (quote) {
            out += c;
            if (c === "\\") {
                out += css[i + 1] ?? "";
                i += 2;
                continue;
            }
            if (c === quote) quote = null;
            i++;
            continue;
        }
        if (c === '"' || c === "'") {
            quote = c;
            out += c;
            i++;
            continue;
        }
        if (c === "/" && css[i + 1] === "*") {
            const end = css.indexOf("*/", i + 2);
            if (end === -1) {
                throw new Error(
                    "widget-css: unterminated comment in the source",
                );
            }
            // A space, not nothing: `a/*x*/b` must not fuse into `ab`.
            out += " ";
            i = end + 2;
            continue;
        }
        out += c;
        i++;
    }
    return out;
}

/** Split a selector list (or a media condition list) on top-level commas —
 *  never on a comma inside `:not()` / `:is()` / `:where()`, an attribute
 *  selector, a `repeat(2, …)` value or a string. */
export function splitTopLevel(input: string, sep = ","): string[] {
    const parts: string[] = [];
    let buf = "";
    let depth = 0;
    let quote: string | null = null;
    for (let i = 0; i < input.length; i++) {
        const c = input[i]!;
        if (quote) {
            buf += c;
            if (c === "\\") {
                buf += input[i + 1] ?? "";
                i++;
            } else if (c === quote) quote = null;
            continue;
        }
        if (c === '"' || c === "'") {
            quote = c;
            buf += c;
            continue;
        }
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") depth--;
        else if (c === sep && depth === 0) {
            if (buf.trim()) parts.push(buf.trim());
            buf = "";
            continue;
        }
        buf += c;
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts;
}

function makeBlockNode(prelude: string, body: Node[]): Rule | AtRule {
    if (!prelude.startsWith("@")) return { kind: "rule", prelude, body };
    const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(prelude);
    if (!m) throw new Error(`widget-css: unreadable at-rule "${prelude}"`);
    return { kind: "at", name: m[1]!, prelude: m[2]!.trim(), body };
}

function parseBlock(
    src: string,
    start: number,
    nested: boolean,
): { nodes: Node[]; next: number } {
    const nodes: Node[] = [];
    let buf = "";
    let i = start;
    let depth = 0;
    let quote: string | null = null;
    while (i < src.length) {
        const c = src[i]!;
        if (quote) {
            buf += c;
            if (c === "\\") {
                buf += src[i + 1] ?? "";
                i += 2;
                continue;
            }
            if (c === quote) quote = null;
            i++;
            continue;
        }
        if (c === '"' || c === "'") {
            quote = c;
            buf += c;
            i++;
            continue;
        }
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") depth--;
        else if (depth === 0 && c === "{") {
            const prelude = collapse(buf);
            buf = "";
            const inner = parseBlock(src, i + 1, true);
            nodes.push(makeBlockNode(prelude, inner.nodes));
            i = inner.next;
            continue;
        } else if (depth === 0 && c === "}") {
            if (!nested) throw new Error("widget-css: stray `}` in the source");
            const tail = collapse(buf);
            if (tail) nodes.push({ kind: "decl", text: tail });
            return { nodes, next: i + 1 };
        } else if (depth === 0 && c === ";") {
            const text = collapse(buf);
            buf = "";
            if (text.startsWith("@")) {
                const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(text)!;
                nodes.push({
                    kind: "at",
                    name: m[1]!,
                    prelude: m[2]!.trim(),
                    body: null,
                });
            } else if (text) {
                nodes.push({ kind: "decl", text });
            }
            i++;
            continue;
        }
        buf += c;
        i++;
    }
    if (nested) throw new Error("widget-css: unterminated block in the source");
    const tail = collapse(buf);
    if (tail) {
        throw new Error(`widget-css: trailing content "${tail.slice(0, 60)}"`);
    }
    return { nodes, next: i };
}

function parse(css: string): Node[] {
    return parseBlock(css, 0, false).nodes;
}

function stringify(nodes: Node[], indent = ""): string {
    const inner = indent + "    ";
    return nodes
        .map((n) => {
            if (n.kind === "decl") return `${indent}${n.text};`;
            if (n.kind === "rule") {
                // A selector list is written one per line; continuation lines
                // take the block's own indent so a nested rule still reads.
                const prelude = n.prelude.split("\n").join(`\n${indent}`);
                return `${indent}${prelude} {\n${stringify(n.body, inner)}\n${indent}}`;
            }
            if (n.body === null) return `${indent}@${n.name} ${n.prelude};`;
            const head = n.prelude ? `@${n.name} ${n.prelude}` : `@${n.name}`;
            return `${indent}${head} {\n${stringify(n.body, inner)}\n${indent}}`;
        })
        .join("\n");
}

/* ------------------------------------------------------------------ scoping */

/** A selector list made only of these cannot be scoped and is dropped. */
const UNIVERSAL_RE = /^\*(?:::?[a-zA-Z-]+)?$/;

/** The leading `:root` compound, with the one qualifier the partials use. */
const ROOT_ANCHOR_RE =
    /^:root(:not\(\[data-theme="light"\]\)|\[data-theme="light"\]|\[data-theme="dark"\])?(?=$|[\s>+~])/;

/** A leading `html` / `body` type selector in base.css's reset rules. */
const DOC_ANCHOR_RE = /^(?:html|body)(?=$|[\s>+~])/;

/** The three shapes a `body` may legitimately lead with in the OUTPUT. The
 *  scope may be followed by a template's `:where([data-widget="…"])`, so `:`
 *  is a legal next character as well as a combinator or the end. */
const THEME_ANCHOR_RE = new RegExp(
    `^body(?:\\[data-theme="(?:light|dark)"\\]|:not\\(\\[data-theme="light"\\]\\)) \\${SCOPE}(?=$|[\\s>+~:])`,
);

/**
 * Rewrite one complex selector so it can only match inside the card.
 *
 * The theme map is the load-bearing part. The widget's root-stamped
 * `data-theme` becomes the site's body-stamped one, and the card scope is
 * spliced in behind it:
 *
 *   `:root`                        -> `.nm-widget-card`
 *   `:root[data-theme="light"]`    -> `body[data-theme="light"] .nm-widget-card`
 *   `:root[data-theme="dark"]`     -> `body[data-theme="dark"] .nm-widget-card`
 *   `:root` inside a dark media    -> `body:not([data-theme="light"]) .nm-widget-card`
 *
 * Specificity survives the move. In the source, the media-query `:root` block
 * (0,1,0) loses to the `[data-theme]` pair (0,2,0); here the media-query form
 * is (0,2,1) and equal to them, but it still loses to `[data-theme="light"]`
 * on source order — and `body:not([data-theme="light"])` cannot match a light
 * body at all, so it loses twice.
 *
 * `scope` is SCOPE for the shared partials and templateScope(key) for one
 * template's own rules; it is spliced in wherever `.nm-widget-card` appears
 * above.
 */
export function scopeSelector(
    selector: string,
    inDarkMedia: boolean,
    scope: string = SCOPE,
): string {
    if (selector.includes(":root")) {
        const m = ROOT_ANCHOR_RE.exec(selector);
        if (!m) {
            throw new Error(
                `widget-css: ":root" appears somewhere this transform does not understand: "${selector}"`,
            );
        }
        const qualifier = m[1];
        let bodyPrefix: string | null;
        if (!qualifier) {
            bodyPrefix = inDarkMedia ? 'body:not([data-theme="light"])' : null;
        } else if (qualifier === ':not([data-theme="light"])') {
            bodyPrefix = 'body:not([data-theme="light"])';
        } else if (qualifier === '[data-theme="light"]') {
            bodyPrefix = 'body[data-theme="light"]';
        } else {
            bodyPrefix = 'body[data-theme="dark"]';
        }
        const rest = selector.slice(m[0].length);
        if (rest.includes(":root")) {
            throw new Error(
                `widget-css: a second ":root" in "${selector}" — unsupported`,
            );
        }
        return `${bodyPrefix ? bodyPrefix + " " : ""}${scope}${rest}`;
    }
    // base.css's reset: `html, body { … }` and `body { … }` become the card
    // itself, declarations and all. The font stack in particular MUST come
    // across — see the module comment.
    const doc = DOC_ANCHOR_RE.exec(selector);
    if (doc) return `${scope}${selector.slice(doc[0].length)}`;
    return `${scope} ${selector}`;
}

/* ------------------------------------------------------- width -> container */

type WidthCond = { feature: "min-width" | "max-width"; px: number };

const WIDTH_COND_RE = /\(\s*(min-width|max-width)\s*:\s*([\d.]+)px\s*\)/g;

function classifyMedia(
    prelude: string,
): { kind: "media" } | { kind: "container"; conds: WidthCond[] } {
    if (!/width/i.test(prelude)) return { kind: "media" };
    const conds: WidthCond[] = [];
    for (const m of prelude.matchAll(WIDTH_COND_RE)) {
        conds.push({ feature: m[1] as WidthCond["feature"], px: Number(m[2]) });
    }
    const residue = prelude
        .replace(WIDTH_COND_RE, "")
        .replace(/\band\b/g, "")
        .trim();
    if (conds.length === 0 || residue !== "") {
        throw new Error(
            `widget-css: @media (${prelude}) mentions width but is not a plain min-/max-width query a container query can express` +
                (residue ? ` (leftover: "${residue}")` : ""),
        );
    }
    return { kind: "container", conds };
}

const holdsAtNarrow = (conds: WidthCond[]) =>
    conds.every((c) =>
        c.feature === "min-width"
            ? NARROW_FALLBACK_PX >= c.px
            : NARROW_FALLBACK_PX <= c.px,
    );

/* ---------------------------------------------------------------- the walk */

type Ctx = { inDarkMedia: boolean; inKeyframes: boolean; scope: string };

type Acc = {
    properties: AtRule[];
    dropped: DroppedRule[];
    containers: { prelude: string; conds: WidthCond[]; body: Node[] }[];
    medias: string[];
};

function declsOf(body: Node[]): string[] {
    return body.filter((n): n is Decl => n.kind === "decl").map((n) => n.text);
}

/** Every selector in a transformed block, at any depth — what a caller gets
 *  told a template contributed. */
function selectorsOf(nodes: Node[]): string[] {
    const out: string[] = [];
    for (const n of nodes) {
        if (n.kind === "rule") out.push(...splitTopLevel(n.prelude));
        else if (n.kind === "at" && n.body) out.push(...selectorsOf(n.body));
    }
    return out;
}

function transformNodes(nodes: Node[], ctx: Ctx, acc: Acc, at: string): Node[] {
    const out: Node[] = [];
    for (const n of nodes) {
        if (n.kind === "decl") {
            out.push(n);
            continue;
        }

        if (n.kind === "rule") {
            // Inside @keyframes the "prelude" is a step (`from`, `to`, `62%`),
            // not a selector. Prefixing one produces a rule that matches
            // nothing and an animation that does nothing.
            if (ctx.inKeyframes) {
                out.push(n);
                continue;
            }
            for (const child of n.body) {
                if (child.kind !== "decl") {
                    throw new Error(
                        `widget-css: nested rule inside "${n.prelude}" — CSS nesting is not supported by this transform`,
                    );
                }
            }
            const sels = splitTopLevel(n.prelude);
            const universal = sels.filter((s) => UNIVERSAL_RE.test(s));
            if (universal.length === sels.length) {
                acc.dropped.push({
                    at,
                    selectors: sels,
                    declarations: declsOf(n.body),
                });
                continue;
            }
            if (universal.length > 0) {
                throw new Error(
                    `widget-css: "${n.prelude}" mixes a universal selector with scopable ones — split it in the partial`,
                );
            }
            const scoped = [
                ...new Set(
                    sels.map((s) =>
                        scopeSelector(s, ctx.inDarkMedia, ctx.scope),
                    ),
                ),
            ];
            out.push({
                kind: "rule",
                prelude: scoped.join(",\n"),
                body: n.body,
            });
            continue;
        }

        // ---- at-rules
        if (n.name === "property") {
            // Document-scoped and unscopable: `--p` has to stay registered at
            // top level or chip.css's wash keyframe snaps instead of sweeping,
            // because an unregistered custom property is an untyped token CSS
            // cannot interpolate.
            if (n.body === null) {
                throw new Error(
                    `widget-css: "@property ${n.prelude}" has no block`,
                );
            }
            acc.properties.push(n);
            continue;
        }

        if (n.body === null) {
            throw new Error(
                `widget-css: unhandled statement at-rule "@${n.name} ${n.prelude}"`,
            );
        }

        if (n.name === "keyframes") {
            out.push({
                ...n,
                body: transformNodes(
                    n.body,
                    { ...ctx, inKeyframes: true },
                    acc,
                    `@keyframes ${n.prelude}`,
                ),
            });
            continue;
        }

        if (n.name === "media") {
            const cls = classifyMedia(n.prelude);
            if (cls.kind === "container") {
                const body = transformNodes(
                    n.body,
                    ctx,
                    acc,
                    `@container ${n.prelude}`,
                );
                if (body.length === 0) continue;
                acc.containers.push({
                    prelude: n.prelude,
                    conds: cls.conds,
                    body,
                });
                out.push({
                    kind: "at",
                    name: "container",
                    prelude: `${CONTAINER_NAME} ${n.prelude}`,
                    body,
                });
                continue;
            }
            const isDark = /prefers-color-scheme\s*:\s*dark/.test(n.prelude);
            const body = transformNodes(
                n.body,
                {
                    scope: ctx.scope,
                    inKeyframes: false,
                    inDarkMedia: ctx.inDarkMedia || isDark,
                },
                acc,
                `@media ${n.prelude}`,
            );
            if (body.length === 0) continue;
            acc.medias.push(n.prelude);
            out.push({ ...n, body });
            continue;
        }

        if (
            n.name === "supports" ||
            n.name === "container" ||
            n.name === "layer"
        ) {
            const body = transformNodes(
                n.body,
                ctx,
                acc,
                `@${n.name} ${n.prelude}`,
            );
            if (body.length === 0) continue;
            out.push({ ...n, body });
            continue;
        }

        throw new Error(
            `widget-css: unhandled at-rule "@${n.name} ${n.prelude}" — decide explicitly whether it can be scoped`,
        );
    }
    return out;
}

/* ------------------------------------------------------------- assertions */

/**
 * The whole safety story. Re-parses the FINISHED stylesheet — not the AST the
 * transform happens to hold — and throws if anything in it could paint outside
 * the card. A future edit to a shared partial that would reset the site's type
 * to 13.5px, or re-anchor a rule on `:root`, fails the build here instead of
 * shipping.
 */
export function assertScoped(css: string): void {
    if (css.includes(":root")) {
        const near = css.slice(
            Math.max(0, css.indexOf(":root") - 60),
            css.indexOf(":root") + 60,
        );
        throw new Error(
            `widget-css: ":root" survived into the output and can never match on the site — near: …${near.trim()}…`,
        );
    }
    const widthMedia = /@media[^{]*\bwidth\b[^{]*/i.exec(css);
    if (widthMedia) {
        throw new Error(
            `widget-css: width-based "@media${widthMedia[0].slice(6)}" survived — a card width must be a @container query, not a viewport one`,
        );
    }

    const nodes = parse(css);
    let sawProperty = false;

    const visit = (list: Node[], inKeyframes: boolean, at: string) => {
        for (const n of list) {
            if (n.kind === "decl") continue;
            if (n.kind === "rule") {
                for (const sel of splitTopLevel(n.prelude)) {
                    if (inKeyframes) {
                        if (!/^(?:from|to|[\d.]+%)$/.test(sel)) {
                            throw new Error(
                                `widget-css: "${sel}" in ${at} is not a keyframe step — a step must never be prefixed`,
                            );
                        }
                        continue;
                    }
                    if (!sel.includes(SCOPE)) {
                        throw new Error(
                            `widget-css: unscoped selector "${sel}" in ${at} — every rule must apply only inside ${SCOPE}`,
                        );
                    }
                    const lead = /^(?:html|body|\*)/.exec(sel);
                    if (lead && !THEME_ANCHOR_RE.test(sel)) {
                        throw new Error(
                            `widget-css: selector "${sel}" in ${at} starts at the document and leaks outside ${SCOPE}`,
                        );
                    }
                }
                continue;
            }
            if (n.name === "property") {
                if (at !== "top level") {
                    throw new Error(
                        `widget-css: "@property ${n.prelude}" is nested in ${at}; it is document-scoped and must be hoisted`,
                    );
                }
                sawProperty = true;
                continue;
            }
            if (n.body) {
                visit(
                    n.body,
                    n.name === "keyframes",
                    `@${n.name} ${n.prelude}`.trim(),
                );
            }
        }
    };
    visit(nodes, false, "top level");

    if (/@property/.test(css) && !sawProperty) {
        throw new Error(
            "widget-css: @property is present but not at top level",
        );
    }
}

/** The names in the output that no selector can scope. */
export interface GlobalNames {
    /** `@keyframes <name>` — one animation name space per document. */
    keyframes: string[];
    /** `@property <--name>` — registering one types that custom property for
     *  the whole document, card or no card. */
    properties: string[];
}

/** Both document-global name spaces a stylesheet claims, in source order. */
export function globalNamesOf(css: string): GlobalNames {
    const bare = stripComments(css);
    const names = (re: RegExp) => [
        ...new Set([...bare.matchAll(re)].map((m) => m[1]!)),
    ];
    return {
        keyframes: names(/@keyframes\s+([\w-]+)/g),
        properties: names(/@property\s+(--[\w-]+)/g),
    };
}

/** Every custom property a stylesheet declares OR reads — `--x: 1` and
 *  `var(--x)` alike, because registering a name types it for both. */
export function customPropertyNames(css: string): Set<string> {
    return new Set(stripComments(css).match(/--[A-Za-z0-9_-]+/g) ?? []);
}

/**
 * The half of the safety story `assertScoped` structurally cannot cover.
 *
 * Selectors are what scoping can rewrite; `@keyframes` names and `@property`
 * registrations are not selectors. Both are document-scoped, this sheet loads
 * after the site's, and a clash between them is silent in both directions —
 * the site's `fadeIn` would start playing the card's keyframes on every page,
 * or the card's `@property --p` would type a `--p` the site uses as a plain
 * token. Nothing matches outside the card and nothing fails; the page just
 * renders differently.
 *
 * So the two name spaces are compared against the site's own stylesheet here,
 * at build time. A collision is not necessarily wrong — it is a decision, and
 * this makes somebody take it.
 */
export function assertNoGlobalCollisions(
    css: string,
    siteCss: string,
    siteLabel = "public/styles.css",
): void {
    const mine = globalNamesOf(css);
    const theirs = globalNamesOf(siteCss);

    const keyframeClash = mine.keyframes.filter((n) =>
        theirs.keyframes.includes(n),
    );
    if (keyframeClash.length) {
        throw new Error(
            `widget-css: @keyframes ${keyframeClash.join(", ")} ${
                keyframeClash.length === 1 ? "is" : "are"
            } also defined in ${siteLabel}. Keyframe names are DOCUMENT-scoped and this sheet loads second, so the widget's steps would replace the site's everywhere — rename the one in the widget partial (every site keyframe is nm-prefixed for this reason).`,
        );
    }

    // A registered property types its name for the whole document, so the
    // clash to look for is not another @property (the site has none) — it is
    // the site USING that name as a plain custom property anywhere.
    const siteProps = customPropertyNames(siteCss);
    const propClash = mine.properties.filter((n) => siteProps.has(n));
    if (propClash.length) {
        throw new Error(
            `widget-css: @property ${propClash.join(", ")} registers ${
                propClash.length === 1 ? "a name" : "names"
            } ${siteLabel} already uses. Registration is DOCUMENT-scoped, so the site's own ${propClash.join(
                ", ",
            )} would be typed (and animated, and invalid-at-computed-value-time) page-wide — rename it in the widget partial.`,
        );
    }
}

/* ----------------------------------------------------------------- the API */

/** Transform the concatenated partials, with a report of what moved. */
export function transformWidgetCss(
    input: string,
    opts: TransformOptions = {},
): TransformResult {
    const acc: Acc = {
        properties: [],
        dropped: [],
        containers: [],
        medias: [],
    };
    const body = transformNodes(
        parse(stripComments(input)),
        { inDarkMedia: false, inKeyframes: false, scope: SCOPE },
        acc,
        "top level",
    );

    // `.wrap` is what the container queries were measured against, so the
    // scope has to carry the same cap. If the partial's cap ever moves, this
    // catches it rather than letting the two silently disagree.
    assertWrapCap(body);

    // Each template's own rules, after the shared partials exactly as they sit
    // after its `@include`s, and narrowed to its own card.
    const templateRules: TransformResult["templateRules"] = [];
    const templateBodies: Node[][] = [];
    for (const t of opts.templates ?? []) {
        const nodes = transformNodes(
            parse(stripComments(t.css)),
            {
                inDarkMedia: false,
                inKeyframes: false,
                scope: templateScope(t.key),
            },
            acc,
            `templates/${t.key}`,
        );
        templateRules.push({ key: t.key, selectors: selectorsOf(nodes) });
        if (nodes.length) templateBodies.push(nodes);
    }

    const scopeRule =
        `${SCOPE} {\n` +
        `    container-type: inline-size;\n` +
        `    container-name: ${CONTAINER_NAME};\n` +
        `    max-width: ${CARD_MAX_WIDTH};\n` +
        `}`;

    const narrow = acc.containers.filter((c) => holdsAtNarrow(c.conds));
    const fallbackBody = narrow.flatMap((c) => c.body);
    const fallback: AtRule | null = fallbackBody.length
        ? {
              kind: "at",
              name: "supports",
              prelude: "not (container-type: inline-size)",
              body: fallbackBody,
          }
        : null;

    const chunks = [scopeRule];
    if (acc.properties.length) chunks.push(stringify(acc.properties));
    chunks.push(stringify(body));
    for (const nodes of templateBodies) chunks.push(stringify(nodes));
    // Last, so at equal specificity the narrow rules win, exactly as they do
    // in the source where each sits after the default it overrides.
    if (fallback) chunks.push(stringify([fallback]));

    const css = chunks.join("\n\n") + "\n";
    assertScoped(css);

    return {
        css,
        templateRules,
        droppedUniversals: acc.dropped,
        containerQueries: acc.containers.map((c) => c.prelude),
        narrowFallbackQueries: narrow.map((c) => c.prelude),
        mediaQueries: acc.medias,
    };
}

function assertWrapCap(nodes: Node[]): void {
    for (const n of nodes) {
        if (n.kind === "rule") {
            if (splitTopLevel(n.prelude).some((s) => s === `${SCOPE} .wrap`)) {
                for (const d of declsOf(n.body)) {
                    const m = /^max-width\s*:\s*(.+)$/.exec(d);
                    if (m && m[1]!.trim() !== CARD_MAX_WIDTH) {
                        throw new Error(
                            `widget-css: .wrap's max-width is now ${m[1]!.trim()} but CARD_MAX_WIDTH is ${CARD_MAX_WIDTH} — the scope and the container queries would measure different boxes`,
                        );
                    }
                }
            }
        } else if (n.kind === "at" && n.body) {
            assertWrapCap(n.body);
        }
    }
}

/** The output contract: one scoped stylesheet, or a throw naming the leak. */
export function scopeWidgetCss(
    input: string,
    opts: TransformOptions = {},
): string {
    return transformWidgetCss(input, opts).css;
}

/* ------------------------------------------------ a template's own rules */

const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const CSS_INCLUDE_RE = /\/\*@include\s+([^\s@]+\.css)\s*@\*\//g;

/**
 * Split one card template into the partials it includes and the rules it adds
 * of its own — the pure half of `readCardTemplateCss`, so the failure modes
 * below are unit-testable without a template on disk.
 *
 * It throws rather than shrugging in two cases, both of which would otherwise
 * ship a card whose layout is quietly missing a piece:
 *   * the template includes a CSS partial WIDGET_CSS_PARTIALS does not carry
 *     (or carries in a different order) — the sheet would be built from a
 *     different stylesheet than the iframe's;
 *   * the template has no `<style>` at all — it is not a card template.
 */
export function splitTemplateCss(
    template: string,
    label: string,
): { includes: string[]; own: string } {
    const regions = [...template.matchAll(STYLE_RE)].map((m) => m[1] ?? "");
    if (!regions.length) {
        throw new Error(
            `widget-css: ${label} has no <style> region, so it cannot be one of the card templates the landing sheet is built from`,
        );
    }
    const includes: string[] = [];
    const own: string[] = [];
    for (const region of regions) {
        for (const m of region.matchAll(CSS_INCLUDE_RE)) includes.push(m[1]!);
        own.push(region.replace(CSS_INCLUDE_RE, ""));
    }
    const want = WIDGET_CSS_PARTIALS.map((f) => `shared/${f}`);
    if (includes.join("|") !== want.join("|")) {
        throw new Error(
            `widget-css: ${label} includes [${includes.join(", ")}] but the sheet is built from [${want.join(
                ", ",
            )}] — the page's card would be styled by a different stylesheet than the iframe's. Update WIDGET_CSS_PARTIALS (order matters) or the template.`,
        );
    }
    // Comments are the bulk of what is left; the transform strips them, and an
    // all-comment region has to read as "this template adds nothing".
    const text = own.join("\n");
    return { includes, own: stripComments(text).trim() ? text : "" };
}

/** Each card template's own rules, in CARD_TEMPLATES order. */
export async function readCardTemplateCss(): Promise<TemplateCss[]> {
    const out: TemplateCss[] = [];
    for (const key of CARD_TEMPLATES) {
        const file = WIDGET_TEMPLATES[key];
        if (!file) {
            throw new Error(
                `widget-css: no template registered for the card widget "${key}" — WIDGET_TEMPLATES (src/widgets.ts) and CARD_TEMPLATES disagree`,
            );
        }
        const template = await readSrc(`templates/${file}`);
        out.push({
            key,
            css: splitTemplateCss(template, `templates/${file}`).own,
        });
    }
    return out;
}

/* -------------------------------------------------------- the disk wrapper */

/** Read the four partials in include order and concatenate them. */
export async function readWidgetCssSource(
    dir = "public/widgets/src/shared",
): Promise<string> {
    const parts = await Promise.all(
        WIDGET_CSS_PARTIALS.map((f) => Bun.file(`${dir}/${f}`).text()),
    );
    return parts.join("\n");
}

/** What ships as public/widget-card.css: the shared partials, each card
 *  template's own rules behind them, and both assertions — nothing escapes the
 *  card's SELECTORS (assertScoped, inside the transform) and nothing collides
 *  with the site's document-global NAMES (assertNoGlobalCollisions, here,
 *  because only this wrapper knows where the site's stylesheet is). */
export async function buildWidgetCardCss(
    dir?: string,
    siteCssPath = "public/styles.css",
): Promise<string> {
    const css = scopeWidgetCss(await readWidgetCssSource(dir), {
        templates: await readCardTemplateCss(),
    });
    const site = Bun.file(siteCssPath);
    if (!(await site.exists())) {
        throw new Error(
            `widget-css: ${siteCssPath} is missing, so the emitted @keyframes and @property names cannot be checked against the page's own — and a clash between them is invisible at runtime`,
        );
    }
    assertNoGlobalCollisions(css, await site.text(), siteCssPath);
    return css;
}
