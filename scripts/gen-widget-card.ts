/**
 * Generates the two assets the landing page's in-chat widget cards need at
 * RUNTIME — the scoped stylesheet and the deferred interaction runtime — plus
 * one tiny strings file per locale.
 *
 *   public/widget-card.css          the widget's own CSS, scoped to
 *                                   `.nm-widget-card` (src/widget-css.ts),
 *                                   plus the rules the other page cards'
 *                                   templates add on top of it
 *   public/widget-card.js           every shared JS partial the bound card
 *                                   templates include, minus shared/bridge.js,
 *                                   plus goal-progress.html's site-card region
 *                                   and public/widgets/src/site/boot.js
 *   public/widget-card.<locale>.js  that locale's slice of WIDGET_STRINGS
 *                                   (plus `en`, always), a few KB each
 *
 * WHY GENERATED AND NOT HAND-PORTED. The cards on the landing page are
 * rendered at build time by the real emitters (scripts/gen-index.ts), so their
 * MARKUP cannot drift from chat. A hand-copied stylesheet or a hand-copied
 * runtime would make the other two halves the ones that drift silently — the
 * page would keep rendering and keep looking almost right. Both are therefore
 * built from the same sources the widgets themselves are assembled from
 * (src/widgets.ts's readSrc/resolveIncludes), and the partial LIST is read out
 * of the templates' own `@include` markers rather than typed here, so a
 * template that gains a partial gains it on the site too.
 *
 * WHY THE STRINGS ARE SPLIT OUT. The full nine-locale WIDGET_STRINGS is ~32 KB
 * of JSON; the runtime is the same bytes on all nine locale pages. Splitting
 * them means one cacheable /widget-card.js shared across /de/, /ja/, … and a
 * small per-locale file beside it, instead of nine near-identical bundles.
 * Only the namespaces the bundle actually reaches for (`T.<ns>`) are emitted,
 * scanned out of the built code rather than listed here — import-meals' string
 * table is more than half the dictionary and no bound card reaches it (the
 * importer's first step is a still picture, see PICTURE_TEMPLATES).
 *
 * Load order on the page (both `defer`, so they run in document order):
 *
 *     <link rel="stylesheet" href="/widget-card.css">
 *     <script defer src="/widget-card.de.js"></script>
 *     <script defer src="/widget-card.js"></script>
 *
 * Re-run after editing any shared widget partial, a card template,
 * public/widgets/src/site/boot.js, or src/copy/widgets.ts:
 *   bun run scripts/gen-widget-card.ts
 * The generated files are the served artifacts (src/index.ts) and are listed
 * in .prettierignore — don't hand-edit them.
 */

import {
    assertNoGlobalCollisions,
    buildWidgetCardCss,
    SCOPE,
    stripComments,
    transformWidgetCss,
    WIDGET_CSS_PARTIALS,
    type TemplateCss,
} from "../src/widget-css.js";
import { readSrc, resolveIncludes } from "../src/widgets.js";
import { siteRegionsOf } from "../src/widget-static.js";
import { WIDGET_STRINGS } from "../src/copy/widgets.js";
import { SITE_LOCALES, type SiteLocale } from "../src/routes.js";

/** The templates whose cards the landing page first shipped, and whose CSS
 *  src/widget-css.ts builds the sheet from (its CARD_TEMPLATES, which
 *  src/widget-css.test.ts pins against this list). The partial list comes
 *  from THEIR `@include` markers, in their order. */
const CARD_TEMPLATES = ["nutrition-summary.html", "trends.html"] as const;

/** The templates of the examples carousel's LIVE cards, beyond those two:
 *  their JS joins the runtime (so taps, drawers and the weight toggle work)
 *  and their own rules join the sheet through buildExtraCardCss. */
export const RUNTIME_TEMPLATES = [
    "meal-logged.html",
    "goal-progress.html",
    "weight-trends.html",
] as const;

/** Templates drawn on the page as STILL PICTURES: their CSS ships, their JS
 *  does not. start_meal_import's first step is a picture of what appears in
 *  chat, with its controls inert, so the importer's code and its 6–13 KB of
 *  strings per locale stay out of the bundle. */
export const PICTURE_TEMPLATES = ["import-meals.html"] as const;

/** Every template whose JS the runtime bundles, in merge order. */
export const BUNDLED_TEMPLATES = [
    ...CARD_TEMPLATES,
    ...RUNTIME_TEMPLATES,
] as const;

/** The one partial the page must not load: it is the MCP-host handshake —
 *  a postMessage protocol, an iframe resize observer and a settings-note
 *  MutationObserver, none of which exist outside a chat host. boot.js says
 *  which three of its helpers that costs and what replaces them. */
const EXCLUDED = new Set(["shared/bridge.js"]);

/** boot.js is appended last, after every partial it calls. */
const BOOT = "site/boot.js";

/** Where the per-locale dictionary lands. Read by shared/i18n.js through the
 *  `WIDGET_STRINGS` binding the bundle opens with. */
const STRINGS_GLOBAL = "window.NM_WIDGET_STRINGS";

/* Size budgets, so the bundle cannot creep silently. Raw bytes, checked after
   every build; they sit ~20% over what the tree currently produces, which is
   room for a partial or two and not room for a stray dependency. Raise one
   deliberately, in the same commit as whatever grew. */
const BUDGETS = {
    // 58.2 KB with goal-progress' track and the importer's form rules.
    css: 70_000,
    // 71.2 KB with the meal-logged, goal-progress and weight-trends partials.
    js: 86_000,
    // uk is the largest at 9.8 KB with goalProgress, mealLogged and
    // weightTrends added.
    strings: 12_000,
} as const;

const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;

function banner(what: string): string {
    return (
        `/* ${what}\n` +
        `   GENERATED by scripts/gen-widget-card.ts — do not edit.\n` +
        `   Sources: public/widgets/src/ (the same partials the in-chat\n` +
        `   widgets are assembled from) — edit those and re-run the script. */\n`
    );
}

const keyOf = (file: string): string => file.replace(/\.html$/, "");

/** Every `.js` partial a template includes, in the template's own order. */
function jsIncludes(template: string): string[] {
    const out: string[] = [];
    for (const m of template.matchAll(INCLUDE_RE)) {
        const rel = m[1]!;
        if (!rel.endsWith(".js") || EXCLUDED.has(rel)) continue;
        if (!out.includes(rel)) out.push(rel);
    }
    return out;
}

/** Merge the templates' lists into one order that satisfies all of them.
 *  Appending each template's new partials at the end is enough here, but
 *  "enough here" is exactly the kind of claim that stops being true quietly —
 *  so the result is checked against every template's own order and the build
 *  fails if it disagrees. */
function mergeOrder(lists: string[][]): string[] {
    const merged: string[] = [];
    for (const list of lists) {
        for (const rel of list) if (!merged.includes(rel)) merged.push(rel);
    }
    for (const list of lists) {
        let at = -1;
        for (const rel of list) {
            const i = merged.indexOf(rel);
            if (i < at) {
                throw new Error(
                    `gen-widget-card: the card templates include their partials in incompatible orders (${rel} moves backwards) — order them by hand here`,
                );
            }
            at = i;
        }
    }
    return merged;
}

/** What the runtime is concatenated from, in order: the merged partials, then
 *  each bundled template's site-card regions, then boot.js. Exported so
 *  src/widget-card.test.ts can hold the shipped file to a fresh build. */
export async function runtimeSources(): Promise<
    { label: string; text: string }[]
> {
    const lists: string[][] = [];
    for (const file of BUNDLED_TEMPLATES) {
        lists.push(jsIncludes(await readSrc(`templates/${file}`)));
    }
    const partials = mergeOrder(lists);
    if (!partials.length) {
        throw new Error(
            "gen-widget-card: no JS partials found in the card templates — did the @include markers change shape?",
        );
    }
    const out: { label: string; text: string }[] = [];
    for (const rel of partials) {
        // Through resolveIncludes, so a partial that grows an @include of its
        // own is expanded exactly as the widget assembler expands it.
        out.push({
            label: rel,
            text: await resolveIncludes(await readSrc(rel), rel, [rel]),
        });
    }
    for (const file of BUNDLED_TEMPLATES) {
        for (const [i, text] of (await siteRegionsOf(keyOf(file))).entries()) {
            out.push({ label: `templates/${file}#site-card-${i + 1}`, text });
        }
    }
    out.push({
        label: BOOT,
        text: await resolveIncludes(await readSrc(BOOT), BOOT, [BOOT]),
    });
    return out;
}

/** NO NAME MAY BE DECLARED TWICE ACROSS THE BUNDLE.
 *
 *  Every unit shares one function scope. A second `const`/`let` of the same
 *  name is a SyntaxError that `new Function` below catches — but a second
 *  FUNCTION DECLARATION is legal, even in strict mode, and silently wins: an
 *  `esc` or a `render` in one partial would quietly replace another's for
 *  every card on the page. So top-level declarations are listed per unit and a
 *  repeat fails the build. Regions are template code at the template's
 *  indentation, so each unit is dedented first. */
export function assertNoRedeclarations(
    units: { label: string; text: string }[],
): void {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const u of units) {
        const lines = u.text.split("\n");
        const indent = Math.min(
            ...lines
                .filter((l) => l.trim())
                .map((l) => l.length - l.trimStart().length),
        );
        const flat = lines.map((l) => l.slice(indent)).join("\n");
        const re =
            /^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
        for (const m of flat.matchAll(re)) {
            const name = (m[1] ?? m[2])!;
            const prev = owner.get(name);
            if (prev && prev !== u.label)
                clashes.push(`${name} (${prev} and ${u.label})`);
            else owner.set(name, u.label);
        }
    }
    if (clashes.length) {
        throw new Error(
            `gen-widget-card: top-level names declared in more than one bundled unit, where the later one would silently win: ${clashes.join(", ")}`,
        );
    }
}

const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const CSS_INCLUDE_RE = /\/\*@include\s+([^\s@]+\.css)\s*@\*\//g;

/** THE OTHER PAGE CARDS' OWN CSS, scoped to each card.
 *
 *  src/widget-css.ts builds the sheet from WIDGET_CSS_PARTIALS and the rules
 *  CARD_TEMPLATES add. The runtime and picture templates need more:
 *  goal-progress.html owns its weight track (`.wtrack`, `.wseg`, `.wpin`,
 *  `.wempty`, `.whead`) and import-meals.html includes shared/form.css and
 *  shared/table.css and owns `.imp` and its step rail. Without them the weight
 *  drawer's track has no height and the importer's drop zone is unstyled.
 *
 *  Built from the same exported transform, per template, under that card's
 *  own `:where([data-widget="<key>"])` scope — so a form rule can never reach
 *  a nutrition card — and appended after the main sheet:
 *
 *    * every shared partial a template includes that the main sheet ALREADY
 *      carries must appear in the main sheet's order, or the page would style
 *      the card with a different cascade than the iframe does;
 *    * any other partial it includes (form.css, table.css) is inlined ahead of
 *      its own rules, in include order. In the iframe those follow base.css;
 *      here they follow the whole main sheet, which differs only where a
 *      chip.css or chart.css class also appears in them — none that the
 *      importer's first step uses;
 *    * the `@keyframes`/`@property` names are held against the site's own
 *      stylesheet exactly as the main sheet's are. */
export async function buildExtraCardCss(
    siteCssPath = "public/styles.css",
): Promise<string> {
    const shared = WIDGET_CSS_PARTIALS.map((f) => `shared/${f}`);
    const templates: TemplateCss[] = [];
    for (const file of [...RUNTIME_TEMPLATES, ...PICTURE_TEMPLATES]) {
        const template = await readSrc(`templates/${file}`);
        const regions = [...template.matchAll(STYLE_RE)].map((m) => m[1] ?? "");
        if (!regions.length) {
            throw new Error(`gen-widget-card: ${file} has no <style> region`);
        }
        const extras: string[] = [];
        let at = -1;
        for (const region of regions) {
            for (const m of region.matchAll(CSS_INCLUDE_RE)) {
                const rel = m[1]!;
                const i = shared.indexOf(rel);
                if (i < 0) {
                    extras.push(rel);
                    continue;
                }
                if (i < at) {
                    throw new Error(
                        `gen-widget-card: ${file} includes ${rel} out of the main sheet's order (${shared.join(", ")})`,
                    );
                }
                at = i;
            }
        }
        const own = regions
            .map((r) => r.replace(CSS_INCLUDE_RE, ""))
            .join("\n");
        const css = [
            ...(await Promise.all(extras.map((rel) => readSrc(rel)))),
            own,
        ].join("\n");
        if (stripComments(css).trim())
            templates.push({ key: keyOf(file), css });
    }
    if (!templates.length) return "";

    // An empty shared input: the transform then emits its scope rule (already
    // in the main sheet), each template's scoped rules, and the narrow
    // fallback for any width query those rules carry.
    const out = transformWidgetCss("", { templates }).css;
    const scopeRule = `${SCOPE} {`;
    const end = out.indexOf("\n}\n");
    if (!out.startsWith(scopeRule) || end < 0) {
        throw new Error(
            "gen-widget-card: the transform no longer opens with the scope rule — find where the template rules start before trimming",
        );
    }
    const css = out.slice(end + 3).replace(/^\n+/, "");
    const site = Bun.file(siteCssPath);
    if (!(await site.exists())) {
        throw new Error(`gen-widget-card: ${siteCssPath} is missing`);
    }
    assertNoGlobalCollisions(css, await site.text(), siteCssPath);
    return css;
}

/** public/widget-card.css minus its banner: the main sheet, then the other
 *  page cards' own rules. */
export async function buildCardSheet(): Promise<string> {
    const main = await buildWidgetCardCss();
    const extra = await buildExtraCardCss();
    return extra ? `${main}\n${extra}` : main;
}

/** The namespaces the built code reads off the ambient `T` (shared/i18n.js).
 *  Scanned rather than listed: a partial that starts reading a new one starts
 *  shipping it, and one that stops stops. */
function usedNamespaces(js: string): string[] {
    const found = new Set<string>();
    for (const m of js.matchAll(/\bT\.([A-Za-z_$][\w$]*)/g)) found.add(m[1]!);
    if (/\bT\s*\[/.test(js)) {
        throw new Error(
            "gen-widget-card: the bundle indexes T dynamically (`T[...]`), so the namespaces it needs cannot be scanned — ship the whole dictionary or keep the access static",
        );
    }
    if (!found.size) {
        throw new Error("gen-widget-card: no `T.<namespace>` use found");
    }
    return [...found].sort();
}

function pickNamespaces(
    strings: Record<string, unknown>,
    namespaces: string[],
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const ns of namespaces) {
        if (ns in strings) out[ns] = strings[ns];
    }
    return out;
}

function sizes(text: string): string {
    const raw = Buffer.byteLength(text);
    const gz = Bun.gzipSync(Buffer.from(text)).length;
    return `${(raw / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzip`;
}

function budget(name: string, text: string, max: number): void {
    const raw = Buffer.byteLength(text);
    if (raw > max) {
        throw new Error(
            `gen-widget-card: ${name} is ${raw} bytes, over its ${max}-byte budget. Something grew — check what, then raise the budget in this file deliberately.`,
        );
    }
}

async function main(): Promise<void> {
    /* ---- the stylesheet. The whole transform, and every assertion that it
       cannot leak outside the card, lives in src/widget-css.ts. */
    const css =
        banner("The in-chat widget CSS, scoped to .nm-widget-card.\n") +
        (await buildCardSheet());

    /* ---- the runtime */
    const units = await runtimeSources();
    assertNoRedeclarations(units);
    const source = units.map((u) => u.text + "\n").join("");
    // Comments are ~75% of these files and every one of them is in the repo.
    // Bun's transpiler is the stripper rather than a regex: these partials are
    // full of regex literals and template literals whose whitespace is part of
    // the painted markup, and it leaves both byte-for-byte.
    const stripped = new Bun.Transpiler({ loader: "js" }).transformSync(source);

    const namespaces = usedNamespaces(stripped);

    const js =
        banner("The in-chat widget runtime for the public site.\n") +
        // One IIFE: these partials declare MACROS, T, fmt, esc, RANGES and
        // three dozen more at their top level, and the page has its own
        // globals (public/site.js). "use strict", as every widget template's
        // own <script> already opens with.
        `(function () {\n"use strict";\n` +
        `const WIDGET_STRINGS = ${STRINGS_GLOBAL} || null;\n` +
        // The strings file is a separate, per-locale <script> that must come
        // first. Missing, the cards stay exactly as the server rendered them:
        // static, complete and readable, minus the interactions.
        `if (!WIDGET_STRINGS || !WIDGET_STRINGS.en) {\n` +
        `    try { console.warn("[widget-card] no ${STRINGS_GLOBAL}; cards stay static"); } catch (e) {}\n` +
        `    return;\n}\n` +
        stripped +
        `})();\n`;

    // Parses, and parses as a whole: a partial that is fine on its own but
    // redeclares something another one already declared fails here rather than
    // in a visitor's console.
    new Function(js);

    /* ---- the per-locale strings */
    const strings = new Map<SiteLocale, string>();
    for (const locale of SITE_LOCALES) {
        const dict = WIDGET_STRINGS[locale];
        if (!dict) {
            throw new Error(
                `gen-widget-card: WIDGET_STRINGS has no "${locale}" — every site locale must have one, or shared/i18n.js falls the page back to English silently`,
            );
        }
        // `en` always rides along: shared/i18n.js initialises T to
        // WIDGET_STRINGS.en, before any locale is resolved.
        const payload: Record<string, unknown> = {
            en: pickNamespaces(
                WIDGET_STRINGS.en as unknown as Record<string, unknown>,
                namespaces,
            ),
        };
        if (locale !== "en") {
            payload[locale] = pickNamespaces(
                dict as unknown as Record<string, unknown>,
                namespaces,
            );
        }
        strings.set(
            locale,
            banner(
                `Widget UI strings for "${locale}" (and the "en" fallback).\n`,
            ) + `${STRINGS_GLOBAL} = ${JSON.stringify(payload)};\n`,
        );
    }

    /* ---- budgets, then disk */
    budget("public/widget-card.css", css, BUDGETS.css);
    budget("public/widget-card.js", js, BUDGETS.js);
    for (const [locale, text] of strings) {
        budget(`public/widget-card.${locale}.js`, text, BUDGETS.strings);
    }

    await Bun.write("public/widget-card.css", css);
    await Bun.write("public/widget-card.js", js);
    for (const [locale, text] of strings) {
        await Bun.write(`public/widget-card.${locale}.js`, text);
    }

    console.log(`public/widget-card.css  ${sizes(css)}`);
    console.log(
        `public/widget-card.js   ${sizes(js)}  (${units.length - 1} units + ${BOOT})`,
    );
    for (const [locale, text] of strings) {
        console.log(`public/widget-card.${locale}.js  ${sizes(text)}`);
    }
    console.log(`namespaces shipped: ${namespaces.join(", ")}`);
}

if (import.meta.main) await main();
