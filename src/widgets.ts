// Assembles the self-contained widget HTML from shared source partials at
// server startup, so the shared design tokens, components, and MCP Apps host
// bridge live in exactly one place instead of being copy-pasted into five files.
//
// Nothing generated is committed: sources live under public/widgets/src/
// (templates/ + shared/), and each widget is stitched together on first use
// (and warmed at boot) into a single inlined HTML string, then cached. The
// iframe CSP forbids external CSS/JS, so "reuse" means inlining the partials —
// which is exactly what the `@include` markers below do.
//
// Template syntax: a partial is pulled in with a marker that is a valid CSS *and*
// JS comment, so a template still parses on its own:
//
//     /*@include shared/tokens.css@*/
//     /*@include shared/bridge.js@*/
//
// Markers resolve relative to public/widgets/src/ and expand recursively.

import { WIDGET_STRINGS } from "./copy/widgets.js";

const SRC_DIR = "./public/widgets/src";
const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;

// Second marker: inline a TypeScript module from src/ as plain JS.
//
//     /*@inlinets src/csv.ts@*/
//
// Exists so a widget can use tested server-side code instead of a hand-copied
// twin. The CSV parser is the case in point: it faces arbitrary user files, so it
// belongs in src/ with fixture tests, but the widget needs it inside the iframe
// where nothing can be imported. Transpiling the real module keeps the two from
// drifting. Only works for modules with NO runtime imports (csv.ts has none) —
// there is no bundler here, just type-stripping.
const INLINE_TS_RE = /\/\*@inlinets\s+([^\s@]+)\s*@\*\//g;

async function inlineTs(relPath: string): Promise<string> {
    const file = Bun.file(`./${relPath}`);
    if (!(await file.exists())) {
        throw new Error(`@inlinets source not found: ${relPath}`);
    }
    const ts = await file.text();
    if (/^\s*import\s/m.test(ts)) {
        throw new Error(
            `@inlinets ${relPath} has runtime imports; only self-contained modules can be inlined`,
        );
    }
    const js = new Bun.Transpiler({ loader: "ts" }).transformSync(ts);
    // Strip module syntax: the result is spliced into a plain <script>, where a
    // bare `export` is a syntax error.
    return js
        .replace(/^export\s+default\s+/gm, "")
        .replace(/^export\s+/gm, "")
        .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, "");
}

// Third marker: inline the widget UI-string dictionary as a plain-data JS
// const.
//
//     /*@i18n@*/
//
// Lives once, in shared/i18n.js (see that file for the runtime locale-pick/
// lookup helpers it defines around this data). Unlike @inlinets this has no
// source-file argument — WIDGET_STRINGS is a single, fixed, already-imported
// object (src/copy/widgets.ts) covering every locale, not a per-marker path.
// Plain JSON.stringify is enough because that dictionary is data-only (no
// functions) by design — see the doc comment on WidgetStrings.
const I18N_RE = /\/\*@i18n@\*\//g;

// ui:// resource name → template file under src/templates/.
export const WIDGET_TEMPLATES: Record<string, string> = {
    "nutrition-summary": "nutrition-summary.html",
    "goal-progress": "goal-progress.html",
    "meal-logged": "meal-logged.html",
    trends: "trends.html",
    "weight-trends": "weight-trends.html",
    "import-meals": "import-meals.html",
    // Dev-only visual reference for the shared components. Listed here so it is
    // assembled and covered by widgets.test.ts, but NO ui:// resource and no
    // tool reference it, so no client can reach it. View via `bun run harness`.
    "component-gallery": "component-gallery.html",
};

const cache = new Map<string, string>();

async function readSrc(relPath: string): Promise<string> {
    const file = Bun.file(`${SRC_DIR}/${relPath}`);
    if (!(await file.exists())) {
        throw new Error(`widget source partial not found: ${relPath}`);
    }
    return file.text();
}

// Expand every @include marker in `text`, recursively, guarding against cycles.
async function resolveIncludes(
    text: string,
    fromPath: string,
    stack: string[],
): Promise<string> {
    const matches = [...text.matchAll(INCLUDE_RE)];
    if (matches.length === 0) return text;

    // Resolve each unique partial once, then substitute.
    const resolved = new Map<string, string>();
    for (const m of matches) {
        const rel = m[1];
        if (!rel || resolved.has(rel)) continue;
        if (stack.includes(rel)) {
            throw new Error(`@include cycle: ${[...stack, rel].join(" -> ")}`);
        }
        const raw = await readSrc(rel);
        resolved.set(rel, await resolveIncludes(raw, rel, [...stack, rel]));
    }
    return text.replace(INCLUDE_RE, (_full, rel) => resolved.get(rel) ?? "");
}

async function assemble(templateFile: string): Promise<string> {
    const template = await readSrc(`templates/${templateFile}`);
    const withPartials = await resolveIncludes(template, templateFile, [
        `templates/${templateFile}`,
    ]);

    // @inlinets and @i18n run after @include so a shared partial can pull
    // either in too.
    const tsMatches = [...withPartials.matchAll(INLINE_TS_RE)];
    const compiled = new Map<string, string>();
    for (const m of tsMatches) {
        const rel = m[1];
        if (!rel || compiled.has(rel)) continue;
        compiled.set(rel, await inlineTs(rel));
    }
    const withTs =
        tsMatches.length === 0
            ? withPartials
            : withPartials.replace(
                  INLINE_TS_RE,
                  (_full, rel) => compiled.get(rel) ?? "",
              );

    if (!I18N_RE.test(withTs)) return withTs;
    I18N_RE.lastIndex = 0;
    const stringsLiteral = `const WIDGET_STRINGS = ${JSON.stringify(WIDGET_STRINGS)};`;
    return withTs.replace(I18N_RE, stringsLiteral);
}

// Return the fully-inlined HTML for a widget, assembling+caching on first use.
export async function getWidgetHtml(key: string): Promise<string> {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const templateFile = WIDGET_TEMPLATES[key];
    if (!templateFile) throw new Error(`unknown widget: ${key}`);
    const html = await assemble(templateFile);
    cache.set(key, html);
    return html;
}

// Assemble every widget once so a broken partial/marker fails fast at startup
// rather than on a client's first tool call.
export async function warmWidgets(): Promise<void> {
    await Promise.all(
        Object.keys(WIDGET_TEMPLATES).map((key) => getWidgetHtml(key)),
    );
}
