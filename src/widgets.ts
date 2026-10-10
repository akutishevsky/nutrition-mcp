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

/**
 * Where get_nutrition_summary puts its MealContributors: the CallToolResult's
 * `_meta`, never `structuredContent`. Hosts cache tools/list for an unknown
 * (possibly multi-day) period and validate structuredContent against the
 * CACHED outputSchema, and Zod 4 emits additionalProperties:false on every
 * object — so a new structuredContent field fails the whole call ("must NOT
 * have additional properties") for every client with a stale list, which was
 * observed live on dev. `_meta` is not validated against outputSchema, is
 * "not intended for model context", and MCP Apps hosts hand the view the full
 * CallToolResult in ui/notifications/tool-result, so the widget still gets it
 * (shared/bridge.js passes it to render as the second argument). The
 * nutrition-summary template repeats this literal (it cannot import), so
 * src/mcp.test.ts checks the assembled widget contains it. The
 * domain prefix keeps it clear of the spec's reserved `_meta` names.
 */
export const MEAL_CONTRIBUTORS_META_KEY = "nutrition-mcp.com/meal-contributors";

/**
 * How many meals the summary widget lists per metric. MUST equal `CAP` in
 * public/widgets/src/shared/macros.js (mealList): get_nutrition_summary keeps
 * exactly the rows that list can show (topMealBreakdown in src/mcp.ts, plus
 * added sugar's `extra` rows from addedSugarExtra), so a larger CAP there would
 * list fewer meals than it claims room for, and a smaller one would ship rows
 * nobody sees. Lives here rather than in mcp.ts so the widget harness, which
 * cannot build the server, uses the same number; public/widgets/macros.test.ts
 * checks CAP against it.
 */
export const MEAL_BREAKDOWN_TOP_N = 8;

/**
 * Where get_weight_trends puts its trend and long-range series (the
 * WeightSeriesMeta built by analyzeWeightHistory in src/weight-trend.ts): the
 * CallToolResult's `_meta`, for the same frozen-outputSchema reason as
 * MEAL_CONTRIBUTORS_META_KEY above. The weight-trends template repeats this
 * literal, and src/mcp.test.ts checks the assembled widget contains it. A host
 * that drops `_meta` leaves the widget on its raw 7/14/30-day chart.
 */
export const WEIGHT_SERIES_META_KEY = "nutrition-mcp.com/weight-series";

/**
 * Where get_trends puts its per-period averages when called with `group_by`
 * (the PeriodAveragesMeta built by buildPeriodAveragesMeta in src/periods.ts):
 * the CallToolResult's `_meta`, for the same frozen-outputSchema reason as the
 * two keys above. Absent without `group_by`. The trends template repeats this
 * literal, and src/mcp.test.ts checks the assembled widget contains it. A host
 * that drops `_meta` leaves the widget on its 7/14/30-day view.
 */
export const PERIOD_AVERAGES_META_KEY = "nutrition-mcp.com/period-averages";

/**
 * Where log_meal, update_meal, get_goal_progress, get_nutrition_summary and
 * get_trends put their added-sugar figures (the AddedSugarMeta built in
 * src/mcp.ts): the CallToolResult's `_meta`, for the same frozen-outputSchema
 * reason as the keys above — none of those tools' structuredContent can gain an
 * `added_sugar_g` field. Present on every return path of those tools. The
 * templates that read it repeat this literal, and src/mcp.test.ts checks the
 * assembled widgets contain it. A host that drops `_meta` leaves the strip
 * without an added-sugar cell, exactly as before the field existed.
 */
export const ADDED_SUGAR_META_KEY = "nutrition-mcp.com/added-sugar";

/**
 * Where log_meal, update_meal, log_saved_meal, get_goal_progress and
 * get_nutrition_summary put the ingredients behind their breakdown rows (the
 * MealItemsMeta built by buildMealItemsMeta in src/meal-items.ts): the
 * CallToolResult's `_meta`, for the same frozen-outputSchema reason as the keys
 * above. `meals` is aligned by position with structuredContent.meals, since
 * the rows carry no id. Omitted when no row has items, so a result without
 * ingredients is unchanged, and also when reading the items failed (the tool
 * still succeeds). The templates that read it repeat this literal, and
 * src/mcp.test.ts checks the assembled widgets contain it. A host that drops
 * `_meta` leaves every row without an expander, exactly as before.
 */
export const MEAL_ITEMS_META_KEY = "nutrition-mcp.com/meal-items";

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
