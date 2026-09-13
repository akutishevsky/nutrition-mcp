// BUILD-TIME rendering of the in-chat widget cards, for the public site.
//
// Nothing the running server does may import this module. Like src/routes.ts
// (a data module with no side-effecting imports) and src/widget-schemas.ts (a
// throwaway McpServer purely to read schemas back), this is a generator- and
// test-only surface: scripts/gen-index.ts calls it to put the REAL widget
// cards on the landing page — get_nutrition_summary, get_trends, the
// log_meal / update_meal card, get_goal_progress, get_weight_trends and a
// still picture of start_meal_import's first step — and src/widget-static.test.ts
// and src/widget-static-cards.test.ts call it to pin what they render. It
// lives in src/ rather than scripts/ for one reason — `bun run typecheck` is
// scoped to src/ and CI-gated, so drift here fails a PR instead of only
// failing whoever next runs a generator.
//
// WHY EVALUATE THE PARTIALS INSTEAD OF PORTING THEM. The landing page used to
// carry hand-approximated mockups of these cards (`.nm-widget`, `.nm-trend`),
// which is a second implementation of a card and therefore a card that drifts:
// it had the wrong abbreviation for Carbs in German and the wrong word for
// Sugar in Japanese, a hardcoded polyline for a chart, and goals written down
// in three places. So the site renders the cards by running the SAME shared
// partials the widget iframe runs — shared/macros.js, shared/spark.js, the
// shared/*-card.js partials and everything they stand on — in a `new Function`
// sandbox with no DOM. The markup is byte-identical to chat by construction
// rather than by review.
//
// HOW THE SANDBOX IS BUILT. Exactly as public/widgets/macros.test.ts builds
// its one: the WIDGET_STRINGS dictionary is prepended as a plain-data `const`
// (the same literal src/widgets.ts splices in for the `@i18n` marker), the
// partials are concatenated in the template's own include order, and the
// emitters are handed back by a trailing `return`. `document` and `window` are
// left undefined, which is what keeps the partials' delegated event wiring
// dormant — every DOM access in them is either inside a function that a card
// render never calls or guarded by `typeof document !== "undefined"`.
//
// WHICH PARTIALS. Read out of the template's own `<script>` region rather than
// listed here, so a partial added to a template reaches the site build with no
// second list to update. The one exclusion is by name and deliberate: see
// EXCLUDED_PARTIALS. The one ADDITION is a template's marked site-card region
// (see siteRegionsOf) — code that stays in the template but that a card needs.

import { WIDGET_STRINGS } from "./copy/widgets.js";
import { readSrc, resolveIncludes, WIDGET_TEMPLATES } from "./widgets.js";
import type { SiteLocale } from "./routes.js";

// ---- Payload shapes -------------------------------------------------------
//
// Hand-written mirrors of the tools' `outputSchema`s (src/mcp.ts), because
// most are declared inline on registerTool and there is no exported Zod object
// to `z.infer` from. They are not the guard: the guard is that every payload
// rendered through here is `parse()`d against the LIVE schema first — see
// validateDemoPayload in src/copy/widget-demo.ts, which also catches the keys
// a z.object() silently STRIPS rather than rejects.

/** One row of `meals[]` — MEAL_BREAKDOWN_ITEM in src/mcp.ts. */
export interface WidgetMealRow {
    description: string;
    meal_type: string | null;
    date: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    alcohol_g: number | null;
    caffeine_mg: number | null;
}

/** GOALS_ITEM: every field nullable, every field REQUIRED (a `.nullable()`
 *  emits as required with an `anyOf[type, null]` value, so an omitted key is a
 *  validation error rather than a null). */
export interface WidgetGoals {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
    alcohol_g: number | null;
    caffeine_mg: number | null;
    water_ml: number | null;
}

/** TOTALS_ITEM. */
export interface WidgetTotals {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    alcohol_g: number | null;
    caffeine_mg: number | null;
    water_ml: number;
}

/** TRENDS_DAY_ITEM: TOTALS_ITEM plus a date, with fiber and sugar nullable
 *  too — null is "nobody recorded this that day", which the widget's own
 *  averaging has to tell apart from a measured zero. */
export interface WidgetTrendsDay extends Omit<
    WidgetTotals,
    "fiber_g" | "sugar_g"
> {
    date: string;
    fiber_g: number | null;
    sugar_g: number | null;
}

export type WaterUnit = "l" | "us_fl_oz" | "uk_fl_oz";
export type DrinkUnit = "us" | "uk" | null;

/** get_nutrition_summary's outputSchema. */
export interface SummaryPayload {
    start_date: string;
    end_date: string;
    logged_days: number;
    days_in_range: number;
    drink_unit: DrinkUnit;
    water_unit: WaterUnit;
    locale: string;
    goals: WidgetGoals | null;
    averages: WidgetTotals;
    recorded_days: {
        fiber_g: number;
        sugar_g: number;
        alcohol_g: number | null;
        caffeine_mg: number;
    };
    days: (WidgetTrendsDay & { meal_count: number })[];
    meals: WidgetMealRow[];
}

/** get_trends' outputSchema. */
export interface TrendsPayload {
    end_date: string;
    default_range: number;
    drink_unit: DrinkUnit;
    water_unit: WaterUnit;
    locale: string;
    goals: WidgetGoals | null;
    days: WidgetTrendsDay[];
}

/** MEAL_PROGRESS_OUTPUT_SCHEMA — what log_meal AND update_meal return. */
export interface MealProgressPayload {
    action: "logged" | "updated";
    date: string;
    drink_unit: DrinkUnit;
    water_unit: WaterUnit;
    locale: string;
    logged_meal: {
        description: string;
        meal_type: string | null;
        calories: number | null;
        protein_g: number | null;
        carbs_g: number | null;
        fat_g: number | null;
        fiber_g: number | null;
        sugar_g: number | null;
        alcohol_g: number | null;
        caffeine_mg: number | null;
    };
    has_goals: boolean;
    goals: WidgetGoals | null;
    totals: WidgetTotals;
    meals: WidgetMealRow[];
}

/** get_goal_progress' outputSchema. */
export interface GoalProgressPayload {
    date: string;
    meal_count: number;
    water_entries: number;
    drink_unit: DrinkUnit;
    water_unit: WaterUnit;
    locale: string;
    goals: WidgetGoals | null;
    totals: WidgetTotals;
    weight: {
        current: number | null;
        target: number | null;
        unit: string;
        logged_on: string | null;
    } | null;
    meals: WidgetMealRow[];
}

/** get_weight_trends' outputSchema. */
export interface WeightTrendsPayload {
    end_date: string;
    unit: string;
    target: number | null;
    default_range: number;
    locale: string;
    days: { date: string; weight: number }[];
}

/** START_IMPORT_OUTPUT_SCHEMA — what start_meal_import returns. */
export interface StartImportPayload {
    tz: string;
    tz_configured: boolean;
    today: string;
    max_rows_per_call: number;
    import_tool_name: string;
    known_source_apps: string[];
    widgets_enabled: boolean;
    drink_unit: DrinkUnit;
    locale: string;
}

// ---- The sandbox ----------------------------------------------------------

/** shared/bridge.js is dropped BY NAME, and it is the only exclusion.
 *
 *  It is not a card partial: it is the MCP Apps host handshake (`ui/initialize`
 *  over postMessage to `window.parent`), the `ResizeObserver` height reporter,
 *  and the `MutationObserver` that keeps the settings note last inside
 *  `[data-widget-foot]`. None of that has a counterpart at build time — there
 *  is no host, no iframe and no document — and its top-level code reaches for
 *  `window` unguarded, so including it would throw while compiling the
 *  sandbox.
 *
 *  Consequence worth saying out loud: the settings note the owner asked to KEEP
 *  on the site's cards is therefore not emitted here. bridge.js appends it at
 *  runtime, so on the landing page it is the deferred runtime copy of these
 *  same partials (or the generator's own foot markup) that must place it — not
 *  this module. What this module emits is the card exactly as the widget's
 *  own `render()` writes it into `#root`, note excluded, which is the honest
 *  boundary: everything inside it is the widget's, nothing outside it is. */
const EXCLUDED_PARTIALS = new Set(["shared/bridge.js"]);

/** `<script>…</script>` bodies. The include markers for CSS partials sit in
 *  `<style>`, so scoping to the script region is what separates the two
 *  without a second filter deciding it by extension. */
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
const JS_INCLUDE_RE = /\/\*@include\s+(shared\/[^\s@]+\.js)\s*@\*\//g;

/** The partial paths a template's script region pulls in, in include order,
 *  de-duplicated, minus the exclusions. */
export async function scriptPartialsOf(widgetKey: string): Promise<string[]> {
    const templateFile = WIDGET_TEMPLATES[widgetKey];
    if (!templateFile) throw new Error(`unknown widget: ${widgetKey}`);
    const template = await readSrc(`templates/${templateFile}`);

    const seen: string[] = [];
    for (const script of template.matchAll(SCRIPT_RE)) {
        for (const m of (script[1] ?? "").matchAll(JS_INCLUDE_RE)) {
            const rel = m[1];
            if (!rel || EXCLUDED_PARTIALS.has(rel) || seen.includes(rel))
                continue;
            seen.push(rel);
        }
    }
    if (seen.length === 0) {
        throw new Error(
            `no shared/*.js @include markers in ${templateFile}'s <script> region — ` +
                `the build-time card renderer reads its partial list from there`,
        );
    }
    return seen;
}

/** A block of a template's own script that a card needs but that stays in the
 *  template, between a start marker comment and an end marker comment.
 *
 *  goal-progress.html is the one user: its weight row (weightNum, weightFig,
 *  weightExtra) is template code by decision, and shared/goal-progress-card.js
 *  is handed weightExtra as an argument. The site needs that function too — at
 *  build time here and in the runtime bundle (scripts/gen-widget-card.ts) — so
 *  both read the block out of the template VERBATIM rather than keeping a
 *  second copy.
 *
 *  Plain block comments, not an assembler marker: src/widgets.ts ignores them,
 *  so the assembled widget is unaffected. */
export const SITE_REGION_RE =
    /\/\* site-card:start \*\/([\s\S]*?)\/\* site-card:end \*\//g;

/** The site-card regions of a template's script, in document order. Empty for
 *  a template that marks none. */
export async function siteRegionsOf(widgetKey: string): Promise<string[]> {
    const templateFile = WIDGET_TEMPLATES[widgetKey];
    if (!templateFile) throw new Error(`unknown widget: ${widgetKey}`);
    const template = await readSrc(`templates/${templateFile}`);
    const out: string[] = [];
    for (const script of template.matchAll(SCRIPT_RE)) {
        for (const m of (script[1] ?? "").matchAll(SITE_REGION_RE)) {
            out.push(m[1] ?? "");
        }
    }
    return out;
}

/** U+2028 / U+2029 are legal inside a JSON string but JSON.stringify leaves
 *  them raw; they are legal inside a JS string literal too since ES2019, so
 *  this is belt-and-braces for an older engine reading a generated artefact. */
function jsLiteral(value: unknown): string {
    return JSON.stringify(value)
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

/** Everything every card needs, whichever template it came from. */
const COMMON_EXPORTS = ["setLocale"] as const;

/** What a template that includes shared/macros.js gets on top — the water
 *  unit and the MACROS table. weight-trends and import-meals include no
 *  macros.js, and naming these there would be a ReferenceError at `return`. */
const MACRO_EXPORTS = ["setWaterUnit", "MACROS", "macroLabel"] as const;

/** Per template, the emitters that template's own card partial defines. */
const TEMPLATE_EXPORTS: Record<string, readonly string[]> = {
    "nutrition-summary": ["summaryCard", "summaryCharted", "loggedDaysCaption"],
    trends: ["trendsView", "trendsCard", "trendsMeta", "RANGES"],
    "meal-logged": ["mealLoggedCard"],
    // weightExtra comes from goal-progress.html's site-card region.
    "goal-progress": [
        "goalProgressCard",
        "goalProgressShowsStrip",
        "weightExtra",
    ],
    "weight-trends": [
        "weightTrendsCard",
        "weightTrendsBody",
        "weightTrendsMeta",
        "WEIGHT_RANGES",
    ],
    "import-meals": ["importFileStep"],
};

/** WHERE EACH CARD'S CHART GRADIENT IDS START.
 *
 *  A chart's area fill needs a `<linearGradient>` of its own — `currentColor`
 *  resolves against the element the gradient sits in, so one shared node would
 *  paint every series the wrong colour — and shared/svg.js names them by
 *  COUNTING: `cg1`, `cg2`, … off a module-level `CH_GRAD_N`. In an iframe
 *  holding one widget that counter is reset by the page load. Out here a
 *  sandbox is reused for every card of its kind, so the same payload rendered
 *  twice would come back with `cg1` and then `cg2` — the markup no longer a
 *  function of its inputs, which a byte-comparing drift test would catch as a
 *  phantom change and a caching generator would emit inconsistently.
 *
 *  So each render sets the counter first. The bases are a block per card
 *  rather than 0 for both, because ids are document-global in HTML and the
 *  landing page carries several cards: two charts each restarting at 1 would
 *  collide. A caller rendering two of the SAME card into one document passes
 *  its own `chartIdBase`, exactly as it passes its own `idPrefix`.
 *
 *  weight-trends draws no area (and so no gradient) today; its block is
 *  reserved so that changing that cannot collide with the trends card.
 *  meal-logged, goal-progress and import-meals include no shared/svg.js. */
const CHART_ID_BASE: Record<string, number> = {
    "nutrition-summary": 0,
    trends: 100,
    "weight-trends": 200,
};

/** A MACROS entry, as much of it as a caller out here has any business reading. */
export interface MacroEntry {
    key: string;
    label: string;
    unit: string;
    color: string;
    role: "cal" | "macro" | "limit" | "bar";
    decimals: number;
    direction?: string;
    display?: { unit: string; per: number; decimals: number };
}

interface BaseSandbox {
    setLocale(locale: string): unknown;
    /** Present only when the template includes shared/svg.js — see
     *  CHART_ID_BASE. */
    setChartIdBase?(base: number): void;
}

/** A template that includes shared/macros.js. */
interface MacroSandbox extends BaseSandbox {
    setWaterUnit(code: string | null | undefined): void;
    MACROS: MacroEntry[];
    macroLabel(m: MacroEntry): string;
}

interface SummarySandbox extends MacroSandbox {
    summaryCard(
        data: SummaryPayload,
        opts: { inlineChart?: boolean; idPrefix?: string },
    ): string;
    summaryCharted(data: SummaryPayload): boolean;
    loggedDaysCaption(data: SummaryPayload): string;
}

interface TrendsView {
    meta: string;
    body: string;
    slots: unknown;
    goals: WidgetGoals | null;
    label?: unknown;
}

interface TrendsSandbox extends MacroSandbox {
    trendsView(
        data: TrendsPayload,
        range: number,
        opts?: { idPrefix?: string },
    ): TrendsView;
    trendsCard(
        view: TrendsView,
        opts: { range: number; inlineChart?: boolean },
    ): string;
    trendsMeta(data: TrendsPayload, range: number): string;
    RANGES: number[];
}

interface MealLoggedSandbox extends MacroSandbox {
    mealLoggedCard(
        data: MealProgressPayload,
        opts: { idPrefix?: string },
    ): string;
}

interface GoalProgressSandbox extends MacroSandbox {
    goalProgressCard(
        data: GoalProgressPayload,
        opts: { weightExtra: unknown; idPrefix?: string },
    ): string;
    goalProgressShowsStrip(data: GoalProgressPayload): boolean;
    weightExtra: unknown;
}

interface WeightTrendsSandbox extends BaseSandbox {
    weightTrendsCard(
        data: WeightTrendsPayload,
        range: number,
        opts: { still?: boolean },
    ): string;
    weightTrendsBody(
        data: WeightTrendsPayload,
        range: number,
        still: boolean,
    ): string;
    weightTrendsMeta(data: WeightTrendsPayload, range: number): string;
    WEIGHT_RANGES: number[];
}

interface ImportSandbox extends BaseSandbox {
    importFileStep(o: {
        noTools: boolean;
        supportEmail: string | null;
        tzConfigured: boolean;
        errors: string[];
        step: string;
    }): string;
}

// One compiled sandbox per (template, locale).
//
// Per TEMPLATE because the templates include different card partials, and
// the partial list is read from the template rather than restated here.
//
// Per LOCALE because the partials carry ambient per-render state — WIDGET_LOCALE
// and T (shared/i18n.js), the `display` the water MACROS entry is pointed at
// (setWaterUnit), date.js's memoised Intl formatters, and SPARK — and a
// sandbox per locale means a renderer that ever forgot one of those setters
// would be wrong for one language instead of for whichever language rendered
// last. Compiling nine of these per generator run is a handful of milliseconds;
// compiling one per CARD would be nine times the locales times the pages.
const sandboxes = new Map<string, Promise<BaseSandbox>>();

async function sandboxFor(
    widgetKey: string,
    locale: SiteLocale,
): Promise<BaseSandbox> {
    const cacheKey = `${widgetKey}|${locale}`;
    const hit = sandboxes.get(cacheKey);
    if (hit) return hit;

    const built = (async () => {
        const partials = await scriptPartialsOf(widgetKey);
        // Through src/widgets.ts's own reader and marker expansion, never a
        // second one: a partial that grows an @include of its own must resolve
        // here exactly as it does in the assembled page.
        const sources = await Promise.all(
            partials.map(async (rel) =>
                resolveIncludes(await readSrc(rel), rel, [rel]),
            ),
        );
        // After the partials: a region's functions call into them only when
        // they run, and declarations hoist either way.
        const regions = await siteRegionsOf(widgetKey);
        const names = [
            ...COMMON_EXPORTS,
            ...(partials.includes("shared/macros.js") ? MACRO_EXPORTS : []),
            ...(TEMPLATE_EXPORTS[widgetKey] ?? []),
        ];
        // The one handle this module adds to the sandbox rather than reads out
        // of it, and it is a write to shared/svg.js's own counter, not a
        // reimplementation of anything — see CHART_ID_BASE. Emitted only when
        // that partial is actually in scope: the body is non-strict, so an
        // assignment to an undeclared `CH_GRAD_N` would silently create a
        // global instead of failing.
        const extras = partials.includes("shared/svg.js")
            ? ["setChartIdBase: (base) => { CH_GRAD_N = base; }"]
            : [];
        const body = [
            // The same plain-data literal src/widgets.ts splices in for the
            // `@i18n` marker, and for the same reason: shared/i18n.js requires
            // WIDGET_STRINGS to already be in scope.
            `const WIDGET_STRINGS = ${jsLiteral(WIDGET_STRINGS)};`,
            ...sources,
            ...regions,
            `return { ${[...names, ...extras].join(", ")} };`,
        ].join("\n");
        const sandbox = new Function(body)() as BaseSandbox;
        // Resolve the locale once here as well as on every render, so a
        // sandbox is never handed out sitting on the wrong dictionary.
        sandbox.setLocale(locale);
        return sandbox;
    })();

    sandboxes.set(cacheKey, built);
    return built;
}

// ---- The cards ------------------------------------------------------------

/** Options every renderer takes.
 *
 *  `idPrefix` namespaces the strip's drawer ids (`macro-drawer` by default).
 *  A page holding TWO strip cards must pass a distinct one per card or both
 *  cards' tiles point their `aria-controls` / `aria-labelledby` at whichever
 *  drawer comes first in document order — see MACRO_DRAWER_PREFIX in
 *  shared/macros.js, which is where the option is honoured. */
export interface StaticCardOptions {
    idPrefix?: string;
    /** Where this card's chart gradient ids start counting — see
     *  CHART_ID_BASE for why they are counted at all and why a second card of
     *  the same kind in one document needs its own block. */
    chartIdBase?: number;
}

/** Put the sandbox's shared/svg.js counter back where this card's ids begin,
 *  so the markup is a function of the payload and nothing else. */
function seedChartIds(
    sb: BaseSandbox,
    widgetKey: string,
    opts: StaticCardOptions,
): void {
    sb.setChartIdBase?.(opts.chartIdBase ?? CHART_ID_BASE[widgetKey] ?? 0);
}

/** The get_nutrition_summary card, as a string of markup.
 *
 *  `locale` is the site locale the page is being generated in, and it is
 *  handed straight to setLocale() — the same call the in-chat template's
 *  render() makes, there with the result of pickLocale(structuredContent.locale,
 *  hostContext.locale). The payload's own `locale` field is not consulted:
 *  out here the page's language IS the user's language, and there is no host
 *  to fall back to.
 *
 *  `inlineChart` is always on. There is no DOM at build time, so the sparkline
 *  is spliced into the focus panel's `.fspark` slot as markup instead of being
 *  painted into it afterwards (see sparkInline in shared/spark.js). A window
 *  of fewer than two logged days has no chart at all — summaryCharted's rule,
 *  not a limitation here — so a single-day card renders the ring, the tiles
 *  and the drawer with an empty `.fspark`. */
export async function renderSummaryCard(
    payload: SummaryPayload,
    locale: SiteLocale,
    opts: StaticCardOptions = {},
): Promise<string> {
    const sb = (await sandboxFor(
        "nutrition-summary",
        locale,
    )) as SummarySandbox;
    sb.setLocale(locale);
    // Litres or fluid ounces, from the payload, exactly as render() does.
    sb.setWaterUnit(payload.water_unit);
    seedChartIds(sb, "nutrition-summary", opts);
    // No onSeries: a tile tap is the deferred runtime's business, and passing
    // one would change no markup anyway (macroPanel reads it only when a tap
    // fires; chartKeys alone decides which tiles are controls).
    return sb.summaryCard(payload, {
        inlineChart: true,
        idPrefix: opts.idPrefix,
    });
}

/** The get_trends card, as a string of markup, opened on `range`.
 *
 *  `range` is one of shared/trends-card.js's RANGES (7 / 14 / 30) and is the
 *  window that reads as pressed on the toggle. The runtime re-slices the same
 *  payload client-side when the toggle is used, so the payload must carry the
 *  widest window whatever `range` is rendered here. */
export async function renderTrendsCard(
    payload: TrendsPayload,
    locale: SiteLocale,
    range: number,
    opts: StaticCardOptions = {},
): Promise<string> {
    const sb = (await sandboxFor("trends", locale)) as TrendsSandbox;
    sb.setLocale(locale);
    sb.setWaterUnit(payload.water_unit);
    seedChartIds(sb, "trends", opts);
    if (!sb.RANGES.includes(range)) {
        throw new Error(
            `renderTrendsCard: range ${range} is not one of ${sb.RANGES.join("/")}`,
        );
    }
    const view = sb.trendsView(payload, range, { idPrefix: opts.idPrefix });
    return sb.trendsCard(view, { range, inlineChart: true });
}

/** The log_meal / update_meal card (shared/meal-logged-card.js), as a string.
 *
 *  THROWS on a payload with no goals. The widget renders NOTHING then — an
 *  empty root the host collapses — so a demo payload that reaches here without
 *  goals is a bug in the demo, and an empty string on the page would be one
 *  nobody sees. `idPrefix` is required in practice as soon as a page holds a
 *  second strip card. */
export async function renderMealLoggedCard(
    payload: MealProgressPayload,
    locale: SiteLocale,
    opts: StaticCardOptions = {},
): Promise<string> {
    const sb = (await sandboxFor("meal-logged", locale)) as MealLoggedSandbox;
    sb.setLocale(locale);
    sb.setWaterUnit(payload.water_unit);
    seedChartIds(sb, "meal-logged", opts);
    const card = sb.mealLoggedCard(payload, { idPrefix: opts.idPrefix });
    if (!card) {
        throw new Error(
            "renderMealLoggedCard: meal-logged renders nothing without goals (has_goals false or goals null) — give the demo payload goals",
        );
    }
    return card;
}

/** The get_goal_progress card (shared/goal-progress-card.js, with
 *  goal-progress.html's own weight row), as a string. */
export async function renderGoalProgressCard(
    payload: GoalProgressPayload,
    locale: SiteLocale,
    opts: StaticCardOptions = {},
): Promise<string> {
    const sb = (await sandboxFor(
        "goal-progress",
        locale,
    )) as GoalProgressSandbox;
    sb.setLocale(locale);
    sb.setWaterUnit(payload.water_unit);
    seedChartIds(sb, "goal-progress", opts);
    return sb.goalProgressCard(payload, {
        weightExtra: sb.weightExtra,
        idPrefix: opts.idPrefix,
    });
}

/** The get_weight_trends card (shared/weight-trends-card.js), opened on
 *  `range`, as a string.
 *
 *  `range` must be one of WEIGHT_RANGES and is the window that reads as
 *  pressed. The card carries fixed ids (`#wt-meta`, `#wt-body`), so a page
 *  holds one of these. Rendered as a FIRST paint (not `.still`), so the chart
 *  draws in once, as the other two chart cards' do. */
export async function renderWeightTrendsCard(
    payload: WeightTrendsPayload,
    locale: SiteLocale,
    range: number,
    opts: StaticCardOptions = {},
): Promise<string> {
    const sb = (await sandboxFor(
        "weight-trends",
        locale,
    )) as WeightTrendsSandbox;
    sb.setLocale(locale);
    seedChartIds(sb, "weight-trends", opts);
    if (!sb.WEIGHT_RANGES.includes(range)) {
        throw new Error(
            `renderWeightTrendsCard: range ${range} is not one of ${sb.WEIGHT_RANGES.join("/")}`,
        );
    }
    return sb.weightTrendsCard(payload, range, { still: false });
}

/** start_meal_import's FIRST STEP, as the widget draws it before a file is
 *  chosen — for a still picture of the importer, not a working one.
 *
 *  Wrapped in `<div class="imp">`, the container import-meals' render() writes
 *  every step into and the one its own CSS lays the card out under
 *  (`.imp > .card`). Its `role="status"` sibling is left out: a picture has
 *  nothing to announce. The host is taken to be one that can call tools (so no
 *  "cannot run here" warning) and there is no pre-flight error; the timezone
 *  notice follows the payload's `tz_configured`, exactly as in chat. The file
 *  input is real markup — making it inert is the page's job. */
export async function renderImportFileStep(
    payload: StartImportPayload,
    locale: SiteLocale,
): Promise<string> {
    const sb = (await sandboxFor("import-meals", locale)) as ImportSandbox;
    sb.setLocale(locale);
    return `<div class="imp">${sb.importFileStep({
        noTools: false,
        supportEmail: null,
        tzConfigured: payload.tz_configured,
        errors: [],
        step: "file",
    })}</div>`;
}

/** The MACROS table, resolved in `locale` — the strip's own list of metrics,
 *  in the order and with the roles the card lays them out by. Exposed so a
 *  caller (a test, a generator that wants to name the metrics beside the card)
 *  reads the real table rather than restating it. */
export async function macrosFor(
    locale: SiteLocale,
): Promise<{ entries: MacroEntry[]; label(m: MacroEntry): string }> {
    const sb = (await sandboxFor("nutrition-summary", locale)) as MacroSandbox;
    sb.setLocale(locale);
    return { entries: sb.MACROS, label: (m) => sb.macroLabel(m) };
}
