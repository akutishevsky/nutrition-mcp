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
    trends: [
        "trendsView",
        "trendsCard",
        "trendsMeta",
        "trendsIsEmpty",
        "trendsEmptyCard",
        "RANGES",
    ],
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
    "import-meals": [
        "importFileStep",
        "importMapStep",
        "importPreviewStep",
        "importDoneStep",
    ],
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
    trendsIsEmpty(data: TrendsPayload): boolean;
    trendsEmptyCard(data: TrendsPayload, range: number): string;
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
        idPrefix?: string;
    }): string;
    /** Each takes the template's own `*StepData()` object plus `diagHtml` and
     *  `idPrefix` — see shared/import-card.js for the fields. */
    importMapStep(o: object): string;
    importPreviewStep(o: object): string;
    importDoneStep(o: object): string;
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
    // Nothing logged in the whole series: the widget's own whole-empty card,
    // not a toggle over three empty ranges — render() in trends.html makes the
    // same choice with the same predicate. trendsView alone would build the
    // range-empty BODY, which is a different state (a wider range has data).
    if (sb.trendsIsEmpty(payload)) return sb.trendsEmptyCard(payload, range);
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

// ---- The importer's screens ----------------------------------------------
//
// In chat, start_meal_import's widget is ONE card that repaints in place:
// choose the file, map its columns, preview, import complete. The site shows
// those screens as still pictures, each rendered through the same emitter the
// widget calls (shared/import-card.js).
//
// Every screen after the first needs a FILE READ BY THE IMPORTER — parsed,
// auto-mapped, sniffed, built into rows, chunked, and for the last screen
// actually imported. None of that lives in a partial the sandbox can run: it
// stands on src/csv.ts and src/chunk.ts, which only the ASSEMBLED widget has
// (`@inlinets`). So the data is derived by running the assembled widget's own
// script once per file — its parseCsv / autoMap / guessSourceApp / buildRows,
// its mapStepData / previewStepData / doneStepData, and its real runImport
// loop, whose bulk_import_meals calls go to src/import.ts's runImport over an
// in-memory store — and the MARKUP is then drawn from that data by the
// per-locale sandbox. The data is locale-independent (numbers, the file's own
// text, and the server's English warnings), so one run serves every locale.
//
// That makes each picture this widget's own reading of the file, down to the
// batch count and the server's warning sentences, with no figure typed twice;
// src/widget-static-cards.test.ts compares each screen with what the assembled
// widget's own mapStep / previewStep / doneStep print for the same file.

/** A CSV file for the importer's later screens: its name and its text. */
export interface ImportFile {
    fileName: string;
    csv: string;
}

/** The importer's four screens, in order. */
export type ImportStep = "file" | "map" | "preview" | "done";
export const IMPORT_STEPS: readonly ImportStep[] = [
    "file",
    "map",
    "preview",
    "done",
];

/** Options for an importer screen. `idPrefix` namespaces the screen's ids and
 *  every reference to them — required in practice as soon as a page holds a
 *  second screen, since every screen has an `imp-title` heading. */
export interface ImportStepOptions {
    idPrefix?: string;
}

/** What importing a file came to, for a caller that quotes it (a reply beside
 *  the picture, a test). Every field is read off the run, never restated. */
export interface ImportFlowSummary {
    fileName: string;
    /** Data rows the parser read. */
    fileRows: number;
    columns: number;
    /** Rows the preview offers to import. */
    rows: number;
    /** Rows dropped before sending (totals, blanks, unreadable dates). */
    skipped: number;
    /** The preview's kcal total, unrounded. */
    kcal: number;
    batches: number;
    /** bulk_import_meals calls the widget made (the dry run included). */
    toolCalls: number;
    created: number;
    deduplicated: number;
    failed: number;
    /** The server's warnings, as the done screen prints them (English). */
    warnings: string[];
    /** What the widget told the model when it finished (updateModelContext). */
    modelContext: string;
    /** The source app the map screen guessed. */
    sourceApp: string;
}

interface ImportFlow {
    summary: ImportFlowSummary;
    map: object;
    preview: object;
    done: object;
}

/** The assembled widget's own step logic, as one fresh instance: a module-level
 *  `S` holds one file's state, so every flow gets its own. The bootstrap line
 *  (`initWidget({…})`, which reaches for the host) is cut off, and `document` /
 *  `window` are handed in as parameters so nothing global is touched — the
 *  same technique public/widgets/card-partials.test.ts uses. */
interface ImportWidget {
    S: Record<string, unknown> & {
        table: { headers: string[]; rows: string[][] } | null;
        result: {
            created: number;
            deduplicated: number;
            failed: number;
            chunkErrors: string[];
            warnings: string[];
        } | null;
        rows: { calories?: number }[];
    };
    setCFG(c: object): void;
    setAPI(a: object): void;
    parseCsv(bytes: Uint8Array): ImportWidget["S"]["table"];
    autoMap(): void;
    guessSourceApp(): void;
    resniffDateFormat(): void;
    resniffEnergyUnit(): void;
    buildRows(): void;
    runImport(): Promise<void>;
    mapStepData(): Record<string, unknown>;
    previewStepData(): Record<string, unknown> & {
        badDates: number;
        chunks: number;
    };
    doneStepData(): Record<string, unknown>;
}

async function importWidgetInstance(): Promise<ImportWidget> {
    const { getWidgetHtml } = await import("./widgets.js");
    const html = await getWidgetHtml("import-meals");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("import-meals: bootstrap not found");
    const document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        activeElement: null,
        addEventListener() {},
        hasFocus: () => false,
    };
    return new Function(
        "document",
        "window",
        `${script.slice(0, boot)}
         return {
             S,
             setCFG: (c) => { CFG = Object.assign({}, CFG, c); },
             setAPI: (a) => { API = a; },
             parseCsv, autoMap, guessSourceApp, resniffDateFormat,
             resniffEnergyUnit, buildRows, runImport,
             mapStepData, previewStepData, doneStepData,
         };`,
    )(document, {}) as ImportWidget;
}

const importFlows = new Map<string, Promise<ImportFlow>>();

/** Pick `file` in the importer opened with `payload`, confirm the mapping it
 *  guessed, confirm the preview, and import — once per (file, payload). */
function importFlow(
    payload: StartImportPayload,
    file: ImportFile,
): Promise<ImportFlow> {
    const key = JSON.stringify([
        payload.tz,
        payload.tz_configured,
        payload.today,
        payload.max_rows_per_call,
        payload.import_tool_name,
        payload.drink_unit,
        file.fileName,
        file.csv,
    ]);
    const hit = importFlows.get(key);
    if (hit) return hit;

    const built = (async (): Promise<ImportFlow> => {
        const w = await importWidgetInstance();
        const { runImport, serializeImportResult } =
            await import("./import.js");
        type Deps = Parameters<typeof runImport>[1];

        // The meals the run writes, keyed by idempotency key, exactly as the
        // server's insert dedupes them.
        const store = new Map<string, Awaited<ReturnType<Deps["insert"]>>>();
        let seq = 0;
        let toolCalls = 0;
        const context: string[] = [];
        const deps: Deps = {
            userId: "00000000-0000-4000-8000-000000000000",
            tz: payload.tz,
            tzConfigured: payload.tz_configured,
            // Midday UTC on the conversation's day: every row is in the past.
            nowMs: Date.parse(`${payload.today}T12:00:00Z`),
            insert: async (input) => {
                const k = input.idempotency_key ?? "";
                const had = store.get(k);
                if (had) return { meal: had.meal, deduplicated: true };
                const meal = {
                    id: `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`,
                    ...input,
                } as unknown as Awaited<ReturnType<Deps["insert"]>>["meal"];
                const res = { meal, deduplicated: false };
                store.set(k, res);
                return res;
            },
            existingKeys: async (keys) =>
                new Set(keys.filter((k) => store.has(k))),
            existingMealIds: async () => new Set(),
        };

        w.setCFG(payload);
        // A host that can call tools, as the file screen assumes: so the
        // preview's Import button is live and no "cannot run here" notice shows.
        w.setAPI({
            canCallTools: true,
            hostContext: {},
            updateModelContext: (text: string) => context.push(text),
            callTool: async (name: string, args: unknown) => {
                if (name !== payload.import_tool_name) {
                    throw new Error(`import-meals called ${name}`);
                }
                toolCalls++;
                // runImport reuses and mutates one args object between the dry
                // run and the real call, so hand the server a copy.
                const result = await runImport(
                    JSON.parse(JSON.stringify(args)),
                    deps,
                );
                return { structuredContent: serializeImportResult(result) };
            },
        });

        // Step 1 -> 2: the file is picked (loadFile, minus the File object).
        w.S.fileName = file.fileName;
        w.S.table = w.parseCsv(new TextEncoder().encode(file.csv));
        const table = w.S.table;
        if (!table || !table.rows.length) {
            throw new Error(`${file.fileName}: the importer reads no rows`);
        }
        w.autoMap();
        w.guessSourceApp();
        w.resniffDateFormat();
        w.resniffEnergyUnit();
        w.S.step = "map";
        const map = w.mapStepData();

        // Step 2 -> 3: Preview import.
        w.buildRows();
        w.S.step = "preview";
        w.S.result = null;
        const preview = w.previewStepData();
        // The diagnostics notice names the maintainer's contact, which never
        // goes on the site — so a file that would need it is refused here
        // rather than drawn without it.
        if (preview.badDates > 0) {
            throw new Error(
                `${file.fileName}: ${preview.badDates} row(s) have unreadable dates — the preview would show the support diagnostics`,
            );
        }

        // Step 3 -> 4: Import.
        await w.runImport();
        // Re-read through the type: TypeScript narrowed S.result to null at the
        // assignment above and cannot see runImport() filling it in.
        const r = w.S.result as ImportWidget["S"]["result"];
        if (w.S.step !== "done" || w.S.aborted || !r) {
            throw new Error(`${file.fileName}: the import did not finish`);
        }
        if (r.failed !== 0 || r.chunkErrors.length) {
            throw new Error(
                `${file.fileName}: the import did not go cleanly (${r.failed} failed, ${r.chunkErrors.join("; ")}) — the done screen would show the support diagnostics`,
            );
        }
        const done = w.doneStepData();

        return {
            summary: {
                fileName: file.fileName,
                fileRows: table.rows.length,
                columns: table.headers.length,
                rows: w.S.rows.length,
                skipped: w.S.skipped as number,
                kcal: w.S.rows.reduce((a, row) => a + (row.calories ?? 0), 0),
                batches: preview.chunks,
                toolCalls,
                created: r.created,
                deduplicated: r.deduplicated,
                failed: r.failed,
                warnings: [...r.warnings],
                modelContext: context.at(-1) ?? "",
                sourceApp: w.S.sourceApp as string,
            },
            map,
            preview,
            done,
        };
    })();
    importFlows.set(key, built);
    return built;
}

/** What importing `file` through the importer opened with `payload` comes to:
 *  the counts the preview and done screens print, and the line the widget
 *  hands the model. */
export async function importFlowSummary(
    payload: StartImportPayload,
    file: ImportFile,
): Promise<ImportFlowSummary> {
    return { ...(await importFlow(payload, file)).summary };
}

/** Wrapped in `<div class="imp">`, the container import-meals' render() writes
 *  every step into and the one its own CSS lays the card out under
 *  (`.imp > .card`). Its `role="status"` sibling is left out: a picture has
 *  nothing to announce. */
const impWrap = (card: string): string => `<div class="imp">${card}</div>`;

/** start_meal_import's FIRST STEP, as the widget draws it before a file is
 *  chosen — for a still picture of the importer, not a working one.
 *
 *  The host is taken to be one that can call tools (so no "cannot run here"
 *  warning) and there is no pre-flight error; the timezone notice follows the
 *  payload's `tz_configured`, exactly as in chat. The file input is real
 *  markup — making it inert is the page's job. */
export async function renderImportFileStep(
    payload: StartImportPayload,
    locale: SiteLocale,
    opts: ImportStepOptions = {},
): Promise<string> {
    const sb = (await sandboxFor("import-meals", locale)) as ImportSandbox;
    sb.setLocale(locale);
    return impWrap(
        sb.importFileStep({
            noTools: false,
            supportEmail: null,
            tzConfigured: payload.tz_configured,
            errors: [],
            step: "file",
            idPrefix: opts.idPrefix,
        }),
    );
}

/** The importer's SECOND screen, "Map columns", once `file` is picked: the
 *  columns as the widget auto-mapped them, its date-format and energy-unit
 *  guesses with their worked examples, and the source app it guessed. */
export async function renderImportMapStep(
    payload: StartImportPayload,
    file: ImportFile,
    locale: SiteLocale,
    opts: ImportStepOptions = {},
): Promise<string> {
    const flow = await importFlow(payload, file);
    const sb = (await sandboxFor("import-meals", locale)) as ImportSandbox;
    sb.setLocale(locale);
    return impWrap(sb.importMapStep({ ...flow.map, idPrefix: opts.idPrefix }));
}

/** The importer's THIRD screen, "Preview", before Import is pressed: the
 *  counts, the conversions applied, the first 30 rows and the Import button. */
export async function renderImportPreviewStep(
    payload: StartImportPayload,
    file: ImportFile,
    locale: SiteLocale,
    opts: ImportStepOptions = {},
): Promise<string> {
    const flow = await importFlow(payload, file);
    const sb = (await sandboxFor("import-meals", locale)) as ImportSandbox;
    sb.setLocale(locale);
    return impWrap(
        sb.importPreviewStep({
            ...flow.preview,
            diagHtml: "",
            idPrefix: opts.idPrefix,
        }),
    );
}

/** The importer's LAST screen, "Import complete", after the real run: what was
 *  imported, and the server's own warnings verbatim (English in every locale,
 *  as in chat — they are bulk_import_meals' text, not widget copy). */
export async function renderImportDoneStep(
    payload: StartImportPayload,
    file: ImportFile,
    locale: SiteLocale,
    opts: ImportStepOptions = {},
): Promise<string> {
    const flow = await importFlow(payload, file);
    const sb = (await sandboxFor("import-meals", locale)) as ImportSandbox;
    sb.setLocale(locale);
    return impWrap(
        sb.importDoneStep({
            ...flow.done,
            diagHtml: "",
            idPrefix: opts.idPrefix,
        }),
    );
}

/** Any one of the importer's screens. `file` is required for every step after
 *  "file". */
export async function renderImportStep(
    step: ImportStep,
    payload: StartImportPayload,
    locale: SiteLocale,
    opts: ImportStepOptions & { file?: ImportFile } = {},
): Promise<string> {
    if (step === "file") return renderImportFileStep(payload, locale, opts);
    if (!opts.file) {
        throw new Error(`renderImportStep: the ${step} screen needs a file`);
    }
    if (step === "map")
        return renderImportMapStep(payload, opts.file, locale, opts);
    if (step === "preview")
        return renderImportPreviewStep(payload, opts.file, locale, opts);
    if (step === "done")
        return renderImportDoneStep(payload, opts.file, locale, opts);
    throw new Error(`renderImportStep: unknown step ${String(step)}`);
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
