/**
 * Build-time rendering of the REAL in-chat widgets, for the landing page.
 *
 * The site cannot embed the widgets as iframes (every response carries
 * `frame-ancestors 'none'`, and the widgets are served only as MCP `ui://`
 * resources). So instead of a hand-drawn approximation that drifts, each card
 * is produced by the widget's own code: the template is assembled exactly as
 * the server assembles it (src/widgets.ts), its inline script is run once in a
 * `node:vm` context against the card's payload, and whatever its `render()`
 * writes into `#root` is the card's markup. The widget's own CSS goes with it
 * inside a declarative shadow root (`<template shadowrootmode="open">`), so
 * the widget's class names (`.panel`, `.ring`, `.seg-btn`, …) and the site's
 * can never style each other.
 *
 * Only this generator runs that script, and only at build time — the page
 * gets static markup and CSS, no widget JS, no eval, no network.
 *
 * WHAT THE SANDBOX STUBS. The template's `shared/bridge.js` (the MCP host
 * handshake) is replaced by a stub `initWidget` that just keeps the config, so
 * the generator can call `render(payload, _meta)` itself. `document` is a stub
 * whose `#root` records `innerHTML`; any other element lookup gets an inert
 * object, so wiring code after a render (the importer's file input, the range
 * toggles' click handler) runs without effect. The clock is pinned to the
 * card's own day, which is what a real chat shows right after the tool call
 * ("Calories today"), and `toLocaleString()` without a locale — what the
 * widget's `fmt()` calls, i.e. the viewer's browser locale in chat — is pinned
 * to the page's language, so /de shows 1.190 and /fr 1 190.
 *
 * WHAT THE CSS TRANSFORM DOES (shadowCss). `:root`, `html` and `body` become
 * `:host`/the shadow wrapper; viewport-width media queries become container
 * queries on the card itself, so a card in a 360px chat column lays out the
 * way the widget does in a 360px iframe; and the explicit
 * `:root[data-theme=…]` overrides are dropped from the shadow CSS and
 * re-emitted as light-DOM rules keyed off the site's own `body[data-theme]`
 * (themeHostCss), because a shadow tree cannot see `<body>`'s attributes while
 * light-DOM rules on the host element beat `:host` rules — so the card follows
 * the site's theme toggle, and `prefers-color-scheme` when it is on System.
 */

import vm from "node:vm";
import { getWidgetHtml, WIDGET_TEMPLATES } from "../src/widgets.js";

const sources = new Map<string, string>();

/** Assemble every widget once, so the renders below can be synchronous. */
export async function loadWidgetSources(): Promise<void> {
    if (sources.size) return;
    for (const key of Object.keys(WIDGET_TEMPLATES))
        sources.set(key, await getWidgetHtml(key));
}

function widgetHtml(key: string): string {
    const html = sources.get(key);
    if (html === undefined)
        throw new Error(`${key}: call loadWidgetSources() first`);
    return html;
}

/** The class every card's shadow host carries. */
export const HOST_CLASS = "nmw";

/** Pull the widget's CSS (every <style>) and its one inline <script> out of
 *  the assembled document, plus the opening tag of its `#root` element. */
function splitWidget(html: string): {
    css: string;
    js: string;
    rootTag: string;
} {
    const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)]
        .map((m) => m[1]!)
        .join("\n");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    if (scripts.length !== 1)
        throw new Error(`expected one <script>, found ${scripts.length}`);
    const rootTag = /<div[^>]*\bid="root"[^>]*>/.exec(html)?.[0];
    if (!rootTag) throw new Error("widget has no #root element");
    return { css, js: scripts[0]![1]!, rootTag };
}

// ------------------------------------------------------------------- CSS

function stripComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Split CSS into top-level blocks: `{ prelude, body }`, where an at-rule's
 *  body is its raw inner text. Comments must already be stripped. */
function topLevelBlocks(css: string): { prelude: string; body: string }[] {
    const out: { prelude: string; body: string }[] = [];
    let i = 0;
    while (i < css.length) {
        const open = css.indexOf("{", i);
        if (open < 0) break;
        const prelude = css.slice(i, open).trim();
        let depth = 1;
        let j = open + 1;
        while (j < css.length && depth > 0) {
            if (css[j] === "{") depth++;
            else if (css[j] === "}") depth--;
            j++;
        }
        out.push({ prelude, body: css.slice(open + 1, j - 1) });
        i = j;
    }
    return out;
}

function minify(css: string): string {
    return css
        .replace(/\s+/g, " ")
        .replace(/\s*([{};,])\s*/g, "$1")
        .replace(/;}/g, "}")
        .trim();
}

/** A selector list with the document-level roots mapped into the shadow tree:
 *  `:root` → `:host`, `html` → `:host`, `body` → the `.nmw-body` wrapper. */
function mapSelectors(prelude: string): string {
    return prelude
        .split(",")
        .map((s) =>
            s
                .trim()
                .replace(/^:root\b/, ":host")
                .replace(/^html\b/, ":host")
                .replace(/^body\b/, ".nmw-body"),
        )
        .join(",");
}

const THEME_OVERRIDE_RE = /^:root\[data-theme="(light|dark)"\]$/;

/** Every class name the markup uses. */
function usedClasses(markup: string): Set<string> {
    const out = new Set<string>();
    for (const m of markup.matchAll(/\bclass="([^"]*)"/g))
        for (const c of m[1]!.split(/\s+/)) if (c) out.add(c);
    return out;
}

/** The widget CSS rewritten for a shadow root (see the file comment), keeping
 *  only the selectors whose every class occurs in `markup` — the template's
 *  stylesheet covers every state and screen (the importer's form, an open
 *  meal drawer), and one static card needs a fraction of it. */
function shadowCss(raw: string, markup: string): string {
    const used = usedClasses(markup);
    used.add("nmw-body"); // the wrapper `body` maps to
    const live = (sel: string) =>
        [...sel.matchAll(/\.([\w-]+)/g)].every((m) => used.has(m[1]!));
    const walk = (css: string, inAt: boolean): string[] => {
        const parts: string[] = [];
        for (const { prelude, body } of topLevelBlocks(css)) {
            if (prelude.startsWith("@")) {
                if (/^@keyframes/.test(prelude)) {
                    parts.push(`${prelude}{${body}}`);
                    continue;
                }
                // Width queries follow the card, not the viewport.
                const at = /^@media\s*\((?:min|max)-width\s*:[^)]*\)$/.test(
                    prelude,
                )
                    ? prelude.replace(/^@media/, "@container nmw")
                    : prelude;
                const inner = walk(body, true);
                if (inner.length) parts.push(`${at}{${inner.join("")}}`);
                continue;
            }
            if (!inAt && THEME_OVERRIDE_RE.test(prelude)) continue;
            const sels = mapSelectors(prelude).split(",").filter(live);
            if (sels.length) parts.push(`${sels.join(",")}{${body}}`);
        }
        return parts;
    };
    return minify(
        walk(stripComments(raw), false).join("") +
            // The page, not the iframe, owns the space around the card: no
            // gutter, no backdrop, and a container for the width queries. A
            // still card has nothing to hover.
            `:host{display:block}.nmw-body{background:transparent;container:nmw/inline-size}.nmw-body>.wrap{padding:0;max-width:none}.interactive,.seg-btn{cursor:default}.interactive:hover{background:none}`,
    );
}

/** Light-DOM rules that pin the cards to the site's explicit theme choice:
 *  the widget's own `:root[data-theme=…]` token blocks, re-keyed off
 *  `body[data-theme=…] .nmw`. Generated from the widget's tokens, so a token
 *  change reaches the site with no second copy. */
export function themeHostCss(): string {
    const { css } = splitWidget(widgetHtml("meal-logged"));
    const rules: string[] = [];
    for (const { prelude, body } of topLevelBlocks(stripComments(css))) {
        const m = THEME_OVERRIDE_RE.exec(prelude);
        if (m) rules.push(`body[data-theme="${m[1]}"] .${HOST_CLASS}{${body}}`);
    }
    if (rules.length !== 2)
        throw new Error("widget tokens lost their data-theme overrides");
    return minify(rules.join(""));
}

// ---------------------------------------------------------------- render

interface StubEl {
    innerHTML: string;
    [k: string]: unknown;
}

/** An object any wiring code can poke at without effect. */
function inert(): unknown {
    const fn = function () {
        return proxy;
    };
    const proxy: unknown = new Proxy(fn, {
        get(_t, key) {
            if (key === Symbol.toPrimitive) return () => "";
            if (key === Symbol.iterator) return [][Symbol.iterator];
            if (key === "length") return 0;
            return proxy;
        },
        set: () => true,
        apply: () => proxy,
    });
    return proxy;
}

export interface RenderOptions {
    /** BCP-47 tag numbers and dates format in (the page's <html lang>). */
    lang: string;
    /** The payload's own date (YYYY-MM-DD): the sandbox's "now", at noon. */
    today: string;
    /** The tool result's `_meta`, handed to render() as its 2nd argument. */
    meta?: Record<string, unknown> | null;
}

/** Run `key`'s real render() against `payload` and return the markup it
 *  writes into its root (wrapped in the root's own element). */
function renderMarkup(
    key: string,
    payload: unknown,
    opts: RenderOptions,
): { css: string; markup: string } {
    const html = widgetHtml(key);
    const { css, js, rootTag } = splitWidget(html);

    const root: StubEl = {
        innerHTML: "",
        addEventListener() {},
        querySelector: () => null,
        querySelectorAll: () => [],
        classList: inert(),
        style: {},
        dataset: {},
    };
    const documentStub = {
        getElementById: (id: string) => (id === "root" ? root : inert()),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener() {},
        removeEventListener() {},
        createElement: () => inert(),
        documentElement: {
            lang: "en",
            style: {},
            dataset: {},
            setAttribute() {},
        },
        body: inert(),
    };
    const ctx: Record<string, unknown> = {
        document: documentStub,
        console,
        requestAnimationFrame: () => 0,
        cancelAnimationFrame() {},
        setTimeout: () => 0,
        clearTimeout() {},
        ResizeObserver: class {
            observe() {}
            disconnect() {}
        },
        MutationObserver: class {
            observe() {}
            disconnect() {}
        },
        matchMedia: () => ({ matches: false, addEventListener() {} }),
        navigator: { language: opts.lang, languages: [opts.lang] },
        location: { href: "about:blank", search: "" },
    };
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.parent = ctx;
    ctx.top = ctx;
    vm.createContext(ctx);

    // Pin the context's own intrinsics: the clock to the card's day, and
    // locale-less formatting to the page language.
    const [y, mo, d] = opts.today.split("-").map(Number) as [
        number,
        number,
        number,
    ];
    vm.runInContext(
        `(() => {
            const RealDate = Date;
            const NOW = new RealDate(${y}, ${mo - 1}, ${d}, 12, 0, 0).getTime();
            function PinnedDate(...a) {
                if (!new.target) return new RealDate(NOW).toString();
                return a.length ? new RealDate(...a) : new RealDate(NOW);
            }
            PinnedDate.prototype = RealDate.prototype;
            PinnedDate.now = () => NOW;
            PinnedDate.UTC = RealDate.UTC;
            PinnedDate.parse = RealDate.parse;
            globalThis.Date = PinnedDate;
            const LANG = ${JSON.stringify(opts.lang)};
            for (const [proto, name] of [
                [Number.prototype, "toLocaleString"],
                [RealDate.prototype, "toLocaleString"],
                [RealDate.prototype, "toLocaleDateString"],
                [RealDate.prototype, "toLocaleTimeString"],
            ]) {
                const real = proto[name];
                proto[name] = function (locales, options) {
                    return real.call(this, locales ?? LANG, options);
                };
            }
            const RealNF = Intl.NumberFormat, RealDTF = Intl.DateTimeFormat;
            Intl.NumberFormat = function (l, o) { return new RealNF(l ?? LANG, o); };
            Intl.NumberFormat.prototype = RealNF.prototype;
            Intl.DateTimeFormat = function (l, o) { return new RealDTF(l ?? LANG, o); };
            Intl.DateTimeFormat.prototype = RealDTF.prototype;
        })();`,
        ctx,
    );

    // The bridge's initWidget is replaced by a later declaration of the same
    // name (the last function declaration in a script wins), so the template
    // runs unmodified and only its config is kept.
    vm.runInContext(
        `${js}\n;function initWidget(config) { globalThis.__config = config; }`,
        ctx,
        { filename: `${key}.html` },
    );
    const config = ctx.__config as {
        render: (data: unknown, meta?: unknown) => void;
        onReady?: (api: unknown) => void;
    };
    if (!config) throw new Error(`${key}: initWidget was never called`);
    config.onReady?.({
        hostContext: { locale: opts.lang, theme: "light" },
        hostInfo: { name: "nutrition-mcp.com" },
        // As in Claude: the host runs app tool calls, so the importer shows
        // no "this host cannot write" fallback. Nothing is ever called.
        canCallTools: true,
        callTool: () => Promise.reject(new Error("static card")),
        updateModelContext: () => Promise.resolve(),
    });
    config.render(payload, opts.meta ?? null);
    const markup = root.innerHTML.replace(/\n\s*/g, "\n").trim();
    if (!markup) throw new Error(`${key}: render() produced no markup`);
    return {
        css,
        markup: `${rootTag.replace(/\s*id="root"/, "")}${markup}</div>`,
    };
}

/** The rendered markup made into a picture: the same elements and classes
 *  (so it looks identical), minus what would promise an interaction the page
 *  does not have — the tiles' button role, focus stop and "shows the meals"
 *  names, the "tap a value" hint and the empty meal drawer, and the range
 *  toggle's buttons (spans with the same classes); any other control is
 *  marked `inert`. */
function stillMarkup(markup: string): string {
    return (
        markup
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/<div class="mhint"[^>]*>[\s\S]*?<\/div>\n?/g, "")
            .replace(/<div class="macro-detail[^"]*"[^>]*><\/div>\n?/g, "")
            .replace(
                /(<div class="[^"]*\binteractive\b[^"]*")([^>]*)>/g,
                (_m, open: string, attrs: string) =>
                    `${open}${attrs.replace(/\s(?:role|tabindex|aria-expanded|aria-label)="[^"]*"/g, "")}>`,
            )
            .replace(
                /<button class="seg-btn([^"]*)"[^>]*>([\s\S]*?)<\/button>/g,
                '<span class="seg-btn$1">$2</span>',
            )
            // Whatever controls remain (the importer's file picker and buttons)
            // stay visible but out of the tab order and the click path.
            .replace(/<(button|input|select|textarea|label)\b/g, "<$1 inert")
    );
}

/** One card: the widget's real markup and CSS in a declarative shadow root.
 *  `shadowrootclonable` because the hero's replay clones its thread nodes. */
export function renderWidgetCard(
    key: string,
    payload: unknown,
    opts: RenderOptions,
): string {
    const { css, markup } = renderMarkup(key, payload, opts);
    const body = stillMarkup(markup);
    const sheet = shadowCss(css, body);
    return `<div class="${HOST_CLASS}"><template shadowrootmode="open" shadowrootclonable><style>${sheet}</style><div class="nmw-body">${body}</div></template></div>`;
}
