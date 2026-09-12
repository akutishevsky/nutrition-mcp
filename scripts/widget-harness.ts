// Local MCP Apps host harness for widget development.
//
//   bun run scripts/widget-harness.ts            # then open http://localhost:8787
//
// Mimics a STRICT host: it validates the ui/initialize request shape, withholds
// the tool result until the app sends ui/notifications/initialized, starts the
// iframe deliberately SHORT so a missing size-changed report shows up as a
// clipped widget, and — unlike anything else we have — answers app-initiated
// tools/call so a widget's server round-trip can be exercised offline.
//
// Query parameters let you reproduce host behaviours that are otherwise only
// observable in production:
//
//   ?serverTools=0      withhold hostCapabilities.serverTools
//   ?tools=0            accept tools/call but never answer (tests timeouts)
//   ?delay=3000         delay every tools/call, standing in for an approval prompt
//   ?maxHeight=600      impose hostContext.containerDimensions.maxHeight
//   ?fail=1             answer tools/call with a JSON-RPC error
//   ?drinkUnit=us       alcohol tracking ON for import-meals (default: off/null)
//   ?alcohol=off        tracking OFF for the MACRO widgets too — every
//                       alcohol_g and drink_unit nulled, so you can see the
//                       row disappear instead of taking the test's word
//   ?caffeine=none      nobody ever logged caffeine (a DATA state, not an
//                       opt-in: there is no caffeine_tracking_enabled) — the
//                       default for most accounts, and previously unseeable
//   ?locale=de          render in that language: overrides the fixture's
//                       `locale` (what every widget reads first) and sets
//                       hostContext.locale to match. Any WIDGET_STRINGS code;
//                       the host page also links to each of them
//   ?waterUnit=us_fl_oz water in fluid ounces (or uk_fl_oz, or l), as the
//                       server sends it to a profile that weighs in pounds
//
// Fixture variants: each one swaps the canned payload for a state the default
// fixture cannot show. Every one is listed in FIXTURE_FLAGS below, which also
// drives the index page and the per-widget variant links on /host:
//
//   ?meals=1            goal-progress: per-meal rows (date null), so the tiered
//                       strip's tiles are buttons and share the drawer with
//                       the weight row. The default stays meals: [] (static)
//   ?meals=0            nutrition-summary / meal-logged: no breakdown rows
//   ?day=today          goal-progress / meal-logged: the date is the viewer's
//                       today (the caloriesToday label); ?day=pastYear puts it
//                       in last year, so the year shows in the header / .csub
//   ?logged=none        goal-progress: no meals, no water. With the weight
//                       still set that is the weight-only day; add
//                       &weight=none for the empty card
//   ?weight=none        goal-progress: weight null; also notarget, noreading,
//                       stale (a reading from last year) and attarget
//   ?goals=none         goals null (meal-logged: has_goals false, height 0)
//   ?alcohol=on         meal-logged: alcohol tracking ON, so four limits
//   ?action=updated     meal-logged: the update_meal header
//   ?days=sparse        trends: unlogged, water-only and fiber-less days;
//                       gap7 (nothing in the last 7 days) and none (whole-empty)
//   ?weights=sparse     weight-trends: weekly weigh-ins; single (one reading in
//                       the last 7 days), gap7 (none in the last 7), none
//   ?target=none        weight-trends: no target weight
//   ?end=pastYear       nutrition-summary / trends / weight-trends: the series
//                       ends last year; ?end=today ends it today
//   ?range=14           trends / weight-trends: default_range 7, 14 or 30
//
// The host page also has buttons to re-deliver the tool result (the same
// payload, or the same one with the next default_range), which is how a
// widget's restore-on-re-render and keep-the-user's-range rules get checked.
//
// The canned tool result each widget is handed is checked against that tool's
// REAL outputSchema before the server starts (assertFixturesMatchSchemas): a
// fixture that has drifted aborts the harness instead of quietly exercising a
// widget's fallback path while someone signs a layout off on it. That covers
// every variant above, since they go through the same resolveFixtures() that
// serves them.
//
// Nothing here is served by the production app; scripts/ is dev-only.

import { getWidgetHtml, WIDGET_TEMPLATES } from "../src/widgets.js";
import { collectOutputSchemas, droppedKeys } from "../src/widget-schemas.js";
import { runImport } from "../src/import.js";
import { WIDGET_STRINGS } from "../src/copy/widgets.js";
import { WATER_UNITS } from "../src/units.js";
import type { MealInput, MealInsertResult } from "../src/supabase.js";

// In-memory stand-in for insertMeal, mirroring its dedup contract, so the harness
// can execute the REAL bulk_import_meals logic instead of returning canned data.
// That is what makes an end-to-end widget run meaningful: the same validation,
// idempotency keys and per-row report a client would get.
const store = new Map<string, MealInput & { id: string }>();
const byId = new Map<string, MealInput & { id: string }>();
let mealSeq = 0;
// Uuid-shaped, because the importer only honours a source_id that could name a
// real meal — "harness-1" ids would make an export re-import look like it
// deduped nothing, which is exactly the bug this flow now guards against.
const harnessMealId = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function fakeInsert(input: MealInput): Promise<MealInsertResult> {
    const key = input.idempotency_key!;
    const existing = store.get(key);
    if (existing) return { meal: existing as never, deduplicated: true };
    const meal = { id: harnessMealId(++mealSeq), ...input };
    store.set(key, meal);
    byId.set(meal.id, meal);
    return { meal: meal as never, deduplicated: false };
}

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const KEYS = Object.keys(WIDGET_TEMPLATES);
// The languages the widgets can actually render — the dictionary's own keys,
// not SITE_LOCALES, so a `?locale=` the widgets have no strings for is refused
// here rather than silently falling back to English inside the iframe.
const LOCALES = Object.keys(WIDGET_STRINGS);

function indexPage(): string {
    const links = KEYS.map(
        (k) =>
            `<li><a href="/host?widget=${encodeURIComponent(k)}">${k}</a></li>`,
    ).join("");
    // Generated from FIXTURE_FLAGS, so this list cannot fall behind the flags
    // the harness actually honours.
    const fixtureRows = FIXTURE_FLAGS.map(
        (f) =>
            `<tr><td><code>?${f.name}=</code></td><td>${f.values.map((v) => `<code>${v}</code>`).join(" ")}</td><td>${f.widgets.join(", ")}</td><td>${f.doc}</td></tr>`,
    ).join("");
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Widget harness</title>
<style>
  body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:32px;max-width:960px}
  code{background:#eee;padding:1px 4px;border-radius:3px}
  li{margin:4px 0}
  table{border-collapse:collapse;margin-top:8px}
  td{border-top:1px solid #ddd;padding:4px 10px 4px 0;vertical-align:top}
</style></head>
<body>
  <h1>MCP Apps widget harness</h1>
  <p>Pick a widget. Append query flags to simulate host behaviour:
     <code>?serverTools=0</code>, <code>?tools=0</code>, <code>?delay=3000</code>,
     <code>?maxHeight=600</code>, <code>?fail=1</code>,
     <code>?locale=de</code> (${LOCALES.join(", ")}).</p>
  <ul>${links}</ul>
  <h2>Fixture variants</h2>
  <p>Each one swaps the canned tool result for a state the default fixture
     cannot show, and every one is checked against the tool's real
     outputSchema at startup. The /host page links the ones that apply to the
     widget it shows.</p>
  <table>${fixtureRows}</table>
</body></html>`;
}

type DrinkUnit = "us" | "uk";
type Fixture = Record<string, unknown>;
type Results = Record<string, Fixture>;

// The single-day fixtures' date, and the day the 30-day series fixtures end on
// unless `?end=` moves them. Fixed rather than "today" so a height recorded one
// day can be compared with one recorded the next; `?day=today` / `?end=today`
// are the variants for the today-only labels.
const END_DATE = "2026-07-15";

// YYYY-MM-DD arithmetic in UTC, so it cannot slip a day across a DST change.
const shiftYmd = (ymd: string, days: number) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!) + days * 86400000)
        .toISOString()
        .slice(0, 10);
};
// The viewer's today in LOCAL time, not UTC: the widgets' isToday() reads the
// browser's clock, and the browser is on this machine. Computed per request, so
// a harness left running past midnight still means today.
const localToday = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
// A date that is unambiguously in LAST year, whatever today is, so the widgets'
// "print the year only when it is not this year" rule has something to print.
const pastYearDate = () => `${new Date().getFullYear() - 1}-11-20`;

// ---------------------------------------------------------------------------
// Canned tool results, one per widget.
//
// One shared fixture does NOT work: each widget's coerce() checks for its own
// shape, so a payload shaped for goal-progress leaves trends stuck on
// "Loading…" — which looks exactly like a broken handshake.
//
// These are checked against the tools' REAL outputSchemas at startup (see
// assertFixturesMatchSchemas below). They had silently drifted off them — the
// trends fixture sent `range_days` where the tool sends `default_range`, and
// weight-trends sent no `target` at all, so the dashed target line and the
// target phrase then printed in the chart's foot never rendered here, and a
// German clipping bug in exactly that phrase reached an audit instead of the
// harness. Since the harness is the surface heights and layouts are signed off
// on, a fixture that is not schema-valid is a review that measured the wrong
// thing.
// ---------------------------------------------------------------------------

// Goals, totals and the per-meal breakdown are shared by several fixtures and
// by the variants that swap them back in (`?meals=1`, `?alcohol=on`), so they
// live out here rather than inside buildResults.
const GOALS = {
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fat_g: 70,
    fiber_g: 30,
    sugar_g: 45,
    alcohol_g: 20,
    caffeine_mg: 400,
    water_ml: 2500,
};
// One row of a day's breakdown, exactly as the single-day tools send them.
interface HarnessMeal {
    description: string;
    meal_type: string;
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
// Per-meal breakdown rows: what makes the panel's chips tappable. `date` is
// null, as the single-day tools send it; the summary stamps its own dates.
const MEALS: HarnessMeal[] = [
    {
        description: "Overnight oats with berries",
        meal_type: "breakfast",
        date: null,
        calories: 420,
        protein_g: 18,
        carbs_g: 62,
        fat_g: 12,
        fiber_g: 9.4,
        sugar_g: 24.6,
        alcohol_g: 0,
        caffeine_mg: null,
    },
    {
        description: "Grilled chicken & rice bowl",
        meal_type: "lunch",
        date: null,
        calories: 650,
        protein_g: 52,
        carbs_g: 78,
        fat_g: 16,
        fiber_g: 6.2,
        sugar_g: 9.4,
        alcohol_g: 0,
        caffeine_mg: null,
    },
    {
        description: "Salmon with quinoa & veg",
        meal_type: "dinner",
        date: null,
        calories: 780,
        protein_g: 56,
        carbs_g: 77,
        fat_g: 32,
        fiber_g: 7.9,
        sugar_g: 14.7,
        alcohol_g: 27.7,
        caffeine_mg: null,
    },
    {
        description: "Double espresso",
        meal_type: "snack",
        date: null,
        calories: 10,
        protein_g: 0,
        carbs_g: 1,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: 0,
        caffeine_mg: 470,
    },
];
// Same rows with alcohol tracking OFF: null, not 0, everywhere.
const MEALS_NO_ALCOHOL: HarnessMeal[] = MEALS.map((m) => ({
    ...m,
    alcohol_g: null,
}));

// THE DAY'S TOTALS ARE THE ROWS ABOVE, SUMMED — never a second set of figures
// typed out beside them. Every tool that sends both halves derives them from
// ONE query: buildMealProgress (src/mcp.ts) is `sumMeals(meals)` and
// `mealBreakdown(meals)` over the same array, so the rows a drawer discloses
// always add up to the tile figure above them. The hand-typed pair had drifted
// on every macro — 1,850 against 1,860 kcal, 190 against 218 g of carbs — and
// the layout, drawer and locale passes were all signed off on a card the server
// cannot produce. assertFixturesMatchSchemas proves the SHAPE; this is what
// makes the arithmetic true, and checkMealProgressCoherence keeps it that way.
const MACRO_KEYS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "caffeine_mg",
] as const;
function sumRows(rows: readonly HarnessMeal[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const key of MACRO_KEYS) {
        const total = rows.reduce((a, r) => a + (r[key] ?? 0), 0);
        // The step the tile prints in, so the fixture carries the digits a real
        // payload would rather than a float's tail.
        out[key] = Math.round(total * 10) / 10;
    }
    return out;
}
// Water is the one figure with no meal behind it — a different tool logs it —
// so it is the only total still stated here. The three deliberate breach states
// survive the sum: sugar 48.7 over a 45 g ceiling, alcohol 27.7 over 20 g and
// caffeine 470 over 400 mg.
const TOTALS = { ...sumRows(MEALS), water_ml: 1500 };

// The meal the meal-logged card announces in its header, and the row it is in
// that day's breakdown. The card credits "Grilled chicken salad · +520 kcal"
// while its drawers list the day's meals, so the announced meal HAS to be one
// of them — production reads both out of the same getMealsByDate call, and the
// fixture used to announce a meal that appeared in none of its seven drawers.
// It STANDS IN for the lunch above rather than joining it, so the day still
// totals under its goals and sugar and caffeine stay the only two breaches.
const LOGGED_MEAL = {
    description: "Grilled chicken salad",
    meal_type: "lunch",
    calories: 520,
    protein_g: 42,
    carbs_g: 28,
    fat_g: 22,
    fiber_g: 7.4,
    sugar_g: 6.1,
    alcohol_g: null,
    caffeine_mg: null,
};
const loggedMealRows = (rows: readonly HarnessMeal[], alcohol: number | null) =>
    rows.map((m) =>
        m.meal_type === "lunch"
            ? { ...LOGGED_MEAL, alcohol_g: alcohol, date: null }
            : m,
    );
// Tracking off (the card's default) and tracking on (`?alcohol=on`), each with
// its own rows and each summed from them.
const MEAL_LOGGED_MEALS = loggedMealRows(MEALS_NO_ALCOHOL, null);
const MEAL_LOGGED_MEALS_ALC = loggedMealRows(MEALS, 0);
const MEAL_LOGGED_TOTALS = {
    ...sumRows(MEAL_LOGGED_MEALS),
    alcohol_g: null,
    water_ml: 1500,
};
const MEAL_LOGGED_TOTALS_ALC = {
    ...sumRows(MEAL_LOGGED_MEALS_ALC),
    water_ml: 1500,
};

// A get_trends day with nothing logged, exactly as trendsDayPayloadOf builds
// it from an empty bucket: the summed macros are real zeros (the day did
// happen, and trends averages over ALL days), but fiber, sugar, alcohol and
// caffeine are null because no meal recorded them. `water_ml` is the one knob:
// a water-only day is this with water and still no food.
const emptyTrendsDay = (date: string, water_ml = 0) => ({
    date,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: null,
    sugar_g: null,
    alcohol_g: null,
    caffeine_mg: null,
    water_ml,
});

// Deterministic, slowly drifting weight for the day `i` of a 30-day series
// (i = 29 is the end date), so 7/14/30 differ and every variant that thins
// the series out reads the same values on the days it keeps.
const weightOn = (i: number) =>
    Math.round((79.6 - i * 0.06 + (i % 3) * 0.15) * 10) / 10;

// `seriesEnd` moves only the 30-day series fixtures (`?end=`). The single-day
// ones stay on END_DATE and move with `?day=`, since the two flags exercise
// different labels.
function buildResults(
    drinkUnit: DrinkUnit | null,
    macroDrinkUnit: DrinkUnit,
    seriesEnd: string = END_DATE,
): Results {
    // One day of the daily series both get_nutrition_summary and get_trends
    // emit. Shaped for TRENDS_DAY_ITEM (the looser of the two: fiber/sugar
    // nullable there, plain numbers in the summary — a number satisfies both).
    const day = (d: string, kcal: number) => ({
        date: d,
        calories: kcal,
        protein_g: Math.round(kcal * 0.07),
        carbs_g: Math.round(kcal * 0.11),
        fat_g: Math.round(kcal * 0.03),
        fiber_g: Math.round(kcal * 0.013 * 10) / 10,
        sugar_g: Math.round(kcal * 0.028 * 10) / 10,
        // Alcohol tracking ON in these fixtures except where noted; 0 is a
        // tracked alcohol-free day, null (see "meal-logged") is tracking off.
        alcohol_g: kcal > 2100 ? 13.9 : 0,
        // Caffeine on most days but not all. null is "nothing recorded that
        // day" — the trends widget must average over the days that carry it,
        // and a 0 here would be a claim the user never made.
        caffeine_mg: kcal > 1900 ? 165 : null,
        water_ml: 1800,
    });
    // Deterministic, mildly spiky pseudo-series. get_trends and
    // get_weight_trends both send up to 30 days regardless of the text window
    // (`allBuckets.slice(-30)` / `seriesCutoff`) because their widgets slice
    // 7/14/30 client-side — so a 7-day fixture made the 14 and 30 toggles
    // repaint identical charts and hid every range-dependent bug.
    const seriesDate = (i: number) => shiftYmd(seriesEnd, i - 29);
    const seriesDays = Array.from({ length: 30 }, (_, i) =>
        day(seriesDate(i), 1875 + ((i * 137) % 500)),
    );
    // The summary's own window is the last 7 of those, so its header reads a
    // 7-day range while `logged_days`/`days_in_range` stay consistent with it.
    const days = seriesDays.slice(-7);

    return {
        // get_nutrition_summary
        "nutrition-summary": {
            start_date: days[0]!.date,
            end_date: seriesEnd,
            logged_days: days.length,
            // Every day in the window is logged, so this previews the no-gap
            // caption. The gappy branch (where the header reads "3 of 30 days
            // logged") is pinned by public/widgets/summary-caption.test.ts;
            // raise days_in_range here if you want to eyeball it.
            days_in_range: days.length,
            drink_unit: macroDrinkUnit,
            water_unit: "l",
            locale: "en",
            goals: GOALS,
            averages: {
                calories: 2076,
                protein_g: 145,
                carbs_g: 228,
                fat_g: 62,
                fiber_g: 27.4,
                sugar_g: 58.1,
                alcohol_g: 7.9,
                caffeine_mg: 165,
                water_ml: 1800,
            },
            // The denominators behind `averages` for the post-launch
            // nutrients. Caffeine is deliberately short of the window (the
            // series has null caffeine days), which is the whole reason this
            // field exists.
            recorded_days: {
                fiber_g: days.length,
                sugar_g: days.length,
                alcohol_g: days.length,
                caffeine_mg: days.filter((d) => d.caffeine_mg != null).length,
            },
            // The summary's day rows carry a meal_count the trends series
            // does not.
            days: days.map((d) => ({ ...d, meal_count: 4 })),
            meals: MEALS.map((m, i) => ({ ...m, date: days[i]!.date })),
        },
        // get_goal_progress
        "goal-progress": {
            date: END_DATE,
            meal_count: 4,
            water_entries: 6,
            drink_unit: macroDrinkUnit,
            water_unit: "l",
            locale: "en",
            goals: GOALS,
            totals: TOTALS,
            // Populated on purpose: a null weight is the branch where the
            // weight row never renders, and an unrendered row is an
            // unreviewed one. Reading + target is the richest of the four
            // weight states (the drawer paints a track, not a prompt); the
            // other three are `?weight=notarget|noreading|none`.
            weight: {
                current: 78.4,
                target: 75,
                unit: "kg",
                logged_on: shiftYmd(END_DATE, -1),
            },
            // Deliberately empty, so the default covers the strip's static
            // path: with no per-meal rows behind them, no tile is a button,
            // the "tap a metric" hint is absent and the weight row is the
            // only disclosure — the drawer is emitted for it alone. The
            // interactive path, where tiles and the weight row share one
            // drawer, is `?meals=1`, and it has to be signed off too.
            meals: [],
        },
        // log_meal / update_meal (both declare MEAL_PROGRESS_OUTPUT_SCHEMA)
        "meal-logged": {
            action: "logged",
            date: END_DATE,
            // Alcohol tracking OFF for this one, so the panel must show no
            // alcohol chip at all (null, not 0) — while the caffeine chip
            // stays, which is the point: caffeine has no opt-in flag, only the
            // data-driven null. `?alcohol=on` is the tracking-on card.
            drink_unit: null,
            water_unit: "l",
            locale: "en",
            logged_meal: LOGGED_MEAL,
            has_goals: true,
            goals: { ...GOALS, alcohol_g: null },
            // Both halves of one day: the tile figures are these rows summed,
            // and the rows contain the meal the header just announced.
            totals: MEAL_LOGGED_TOTALS,
            meals: MEAL_LOGGED_MEALS,
        },
        // get_trends
        trends: {
            end_date: seriesEnd,
            // Which toggle the widget opens on. `range_days` here was the
            // drift: the template reads `default_range`, so the seg opened on
            // its own fallback rather than on what the tool chose.
            default_range: 7,
            drink_unit: macroDrinkUnit,
            water_unit: "l",
            locale: "en",
            goals: GOALS,
            days: seriesDays,
        },
        // get_weight_trends
        "weight-trends": {
            end_date: seriesEnd,
            unit: "kg",
            // Populated on purpose: with target null the dashed target line
            // and the panel's target phrase never paint. That state is
            // `?target=none`; the default is the one with more to clip.
            target: 75,
            default_range: 7,
            locale: "en",
            // A weigh-in every day. The calendar axis, the bridged line and
            // the per-reading marks only differ from index spacing when days
            // are MISSING, which is what `?weights=` is for.
            days: seriesDays.map((d, i) => ({
                date: d.date,
                weight: weightOn(i),
            })),
        },
        // start_meal_import
        "import-meals": {
            tz: "Europe/Kyiv",
            tz_configured: true,
            today: END_DATE,
            max_rows_per_call: 50,
            import_tool_name: "bulk_import_meals",
            known_source_apps: [
                "myfitnesspal",
                "cronometer",
                "loseit",
                "macrofactor",
            ],
            widgets_enabled: true,
            drink_unit: drinkUnit,
            locale: "en",
        },
        // The dev-only gallery. No tool renders it, so there is no schema to
        // hold it to and it is absent from FIXTURE_TOOL below — but it reads
        // locale and water_unit from its payload like any widget, and carrying
        // the two fields is what lets `?locale=` and `?waterUnit=` reach it
        // (both overrides only touch a fixture that already has the field).
        "component-gallery": { gallery: true, locale: "en", water_unit: "l" },
    };
}

// ---------------------------------------------------------------------------
// Fixture variants.
//
// Each flag rewrites the built fixtures into one state the defaults cannot
// show. They are post-build transforms rather than extra buildResults()
// parameters so the defaults above stay readable as the ONE canonical payload
// per tool, and each variant says only what it changes.
//
// `apply` receives the whole Results map and a context, and mutates nothing:
// it returns fresh objects for the widgets it touches, so a variant can never
// leak into another widget's payload through a shared reference (GOALS, TOTALS
// and MEALS are shared by several fixtures).
// ---------------------------------------------------------------------------
interface FixtureCtx {
    macroDrinkUnit: DrinkUnit;
    today: string;
    pastYear: string;
}
interface FixtureFlag {
    name: string;
    values: readonly string[];
    widgets: readonly string[];
    doc: string;
    // Absent for the flags resolveFixtures() handles itself (drinkUnit,
    // alcohol=off, caffeine, waterUnit), which are listed here for the docs
    // and the links only.
    apply?: (r: Results, value: string, ctx: FixtureCtx) => void;
}

const patch = (r: Results, widget: string, fields: Fixture) => {
    r[widget] = { ...r[widget]!, ...fields };
};
const MACRO_WIDGETS = [
    "nutrition-summary",
    "goal-progress",
    "meal-logged",
    "trends",
] as const;
// The four of them plus the gallery: everything that reads water_unit.
const WATER_WIDGETS = [...MACRO_WIDGETS, "component-gallery"] as const;

// Ordered: resolveFixtures applies them top to bottom, so a later flag sees
// an earlier one's result. `alcohol=on` rebuilds meal-logged's rows before
// `meals=0` may empty them; `logged=none` zeroes goal-progress before `day`
// and `weight` restamp its dates; `goals=none` runs last among the
// single-day flags so it wins over anything that restored goals.
const FIXTURE_FLAGS: readonly FixtureFlag[] = [
    {
        name: "drinkUnit",
        values: ["us", "uk"],
        widgets: ["import-meals", ...MACRO_WIDGETS],
        doc: "Alcohol tracking ON for import-meals (default off), and the drink convention the macro widgets gloss alcohol in (default us). <code>uk</code> is the only way to see the UK-units gloss.",
    },
    {
        name: "alcohol",
        values: ["off", "on"],
        widgets: MACRO_WIDGETS,
        doc: "<code>off</code>: tracking OFF on every macro widget (every alcohol field and drink_unit null). <code>on</code>: tracking ON for meal-logged, whose default is off — the four-limit card.",
        apply(r, value, ctx) {
            if (value !== "on") return;
            const ml = r["meal-logged"]!;
            patch(r, "meal-logged", {
                drink_unit: ctx.macroDrinkUnit,
                // A tracked alcohol-free meal: 0, not null.
                logged_meal: {
                    ...(ml.logged_meal as Fixture),
                    alcohol_g: 0,
                },
                goals: GOALS,
                // The alcohol-tracked rows, and their own sum — the same
                // coherence the default card has (see MEAL_LOGGED_TOTALS).
                totals: MEAL_LOGGED_TOTALS_ALC,
                meals: MEAL_LOGGED_MEALS_ALC,
            });
        },
    },
    {
        name: "caffeine",
        values: ["none"],
        widgets: MACRO_WIDGETS,
        doc: "Nobody ever logged caffeine: every caffeine figure null and its recorded-days count 0. A data state, not an opt-in.",
    },
    {
        name: "meals",
        values: ["1", "0"],
        widgets: ["goal-progress", "nutrition-summary", "meal-logged"],
        doc: "<code>1</code>: goal-progress gets per-meal rows (date null), so its tiles are buttons sharing the drawer with the weight row — the interactive tiered path. <code>0</code>: no breakdown rows (goal-progress' default), so every strip takes its static path.",
        apply(r, value) {
            if (value === "1") patch(r, "goal-progress", { meals: MEALS });
            else
                for (const w of [
                    "goal-progress",
                    "nutrition-summary",
                    "meal-logged",
                ])
                    patch(r, w, { meals: [] });
        },
    },
    {
        name: "logged",
        values: ["none"],
        widgets: ["goal-progress"],
        doc: "Nothing logged on the day: no meals, no water, every total 0 (caffeine null). With the weight still set this is the weight-only day; add <code>&amp;weight=none</code> for the empty card.",
        apply(r) {
            const gp = r["goal-progress"]!;
            patch(r, "goal-progress", {
                meal_count: 0,
                water_entries: 0,
                totals: {
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fat_g: 0,
                    fiber_g: 0,
                    sugar_g: 0,
                    // totalsPayloadOf: 0 while tracking is on, null when off.
                    alcohol_g: gp.drink_unit == null ? null : 0,
                    // No meal carried a caffeine figure, so null — not 0.
                    caffeine_mg: null,
                    water_ml: 0,
                },
                meals: [],
            });
        },
    },
    {
        name: "day",
        values: ["today", "pastYear"],
        widgets: ["goal-progress", "meal-logged"],
        doc: "The day shown: the viewer's today (the calories-today label), or a day in last year (the year in the header meta / .csub, never in the panel label). goal-progress' weight moves with it, weighed the day before.",
        apply(r, value, ctx) {
            const date = value === "today" ? ctx.today : ctx.pastYear;
            patch(r, "meal-logged", { date });
            const w = r["goal-progress"]!.weight as Fixture | null;
            patch(r, "goal-progress", {
                date,
                weight:
                    w && w.logged_on != null
                        ? { ...w, logged_on: shiftYmd(date, -1) }
                        : w,
            });
        },
    },
    {
        name: "weight",
        values: ["none", "notarget", "noreading", "stale", "attarget"],
        widgets: ["goal-progress"],
        doc: "The weight row's states: <code>none</code> (weight null: the &ldquo;No weight logged yet&rdquo; line, no button — the server sends null only with neither a reading nor a target), <code>notarget</code> (reading, no target), <code>noreading</code> (target, never weighed), <code>stale</code> (last reading is from last year, so it needs its year), <code>attarget</code> (reading equals the target).",
        apply(r, value, ctx) {
            const w = r["goal-progress"]!.weight as Fixture;
            const next =
                value === "none"
                    ? null
                    : value === "notarget"
                      ? { ...w, target: null }
                      : value === "noreading"
                        ? { ...w, current: null, logged_on: null }
                        : value === "stale"
                          ? { ...w, logged_on: ctx.pastYear }
                          : { ...w, current: w.target };
            patch(r, "goal-progress", { weight: next });
        },
    },
    {
        name: "goals",
        values: ["none"],
        widgets: MACRO_WIDGETS,
        doc: "No goals set: goals null. For meal-logged that is has_goals false, which must render nothing at all (height 0).",
        apply(r) {
            for (const w of ["nutrition-summary", "goal-progress", "trends"])
                patch(r, w, { goals: null });
            patch(r, "meal-logged", { has_goals: false, goals: null });
        },
    },
    {
        name: "action",
        values: ["updated"],
        widgets: ["meal-logged"],
        doc: "The update_meal card rather than log_meal's (only the header changes).",
        apply(r) {
            patch(r, "meal-logged", { action: "updated" });
        },
    },
    {
        name: "days",
        values: ["sparse", "gap7", "none"],
        widgets: ["trends"],
        doc: "<code>sparse</code>: unlogged zero days, a water-only day and two logged days with no fiber figure (zero buckets chart as 0, null fiber as a gap). <code>gap7</code>: nothing in the last 7 days, so the default range is empty but 14/30 are not. <code>none</code>: nothing in all 30 days (the whole-empty card).",
        apply(r, value) {
            const days = r.trends!.days as Array<Fixture & { date: string }>;
            // `o` counts back from the end date: o = 0 is its last day.
            const next = days.map((d, i) => {
                const o = days.length - 1 - i;
                if (value === "none" || (value === "gap7" && o < 7))
                    return emptyTrendsDay(d.date);
                if (value !== "sparse") return d;
                if (o === 2) return emptyTrendsDay(d.date, 1400);
                if ([1, 4, 5, 9, 12, 16, 17, 23, 26].includes(o))
                    return emptyTrendsDay(d.date);
                if (o === 3 || o === 10) return { ...d, fiber_g: null };
                return d;
            });
            patch(r, "trends", { days: next });
        },
    },
    {
        name: "weights",
        values: ["sparse", "single", "gap7", "none"],
        widgets: ["weight-trends"],
        doc: "<code>sparse</code>: weekly weigh-ins (calendar spacing, bridged line, a mark per reading). <code>single</code>: one reading in the last 7 days, more earlier. <code>gap7</code>: none in the last 7 days. <code>none</code>: no readings at all (the empty card).",
        apply(r, value) {
            const days = r["weight-trends"]!.days as Fixture[];
            // Days counted back from the end date that keep their reading.
            const keep =
                value === "sparse"
                    ? (o: number) => [0, 6, 13, 20, 27].includes(o)
                    : value === "single"
                      ? (o: number) => [3, 9, 12, 16, 20, 25, 29].includes(o)
                      : value === "gap7"
                        ? (o: number) => o >= 7
                        : () => false;
            patch(r, "weight-trends", {
                days: days.filter((_, i) => keep(days.length - 1 - i)),
            });
        },
    },
    {
        name: "target",
        values: ["none"],
        widgets: ["weight-trends"],
        doc: "No target weight: no dashed target line and no target phrase.",
        apply(r) {
            patch(r, "weight-trends", { target: null });
        },
    },
    {
        name: "end",
        values: ["today", "pastYear"],
        widgets: ["nutrition-summary", "trends", "weight-trends"],
        doc: "Where the 30-day series ends: today (no year anywhere), or a day in last year (the year in the header range).",
        // Handled in resolveFixtures: it is buildResults' seriesEnd, since
        // every date in three series moves with it.
    },
    {
        name: "range",
        values: ["7", "14", "30"],
        widgets: ["trends", "weight-trends"],
        doc: "The default_range the tool chose, i.e. which toggle the widget opens on (fixture default 7).",
        apply(r, value) {
            for (const w of ["trends", "weight-trends"])
                patch(r, w, { default_range: Number(value) });
        },
    },
    {
        name: "waterUnit",
        values: ["l", "us_fl_oz", "uk_fl_oz"],
        widgets: WATER_WIDGETS,
        doc: "Water in litres or fluid ounces, as the server sends it to a profile that weighs in pounds.",
    },
];

// Parse the fixture-shaping flags off a URL and return the payloads they
// describe, plus what the host page needs to say about them. Both the served
// page and assertFixturesMatchSchemas go through this one function, so the
// payload a /host URL delivers is exactly the one that was validated — the
// overrides can never be applied only on the serving side, where no check
// would see them.
function resolveFixtures(params: URLSearchParams): {
    results: Results;
    drinkUnit: DrinkUnit | null;
    locale: string | null;
    waterUnit: string | null;
    labels: string[];
} {
    // The alcohol opt-in, as every tool that touches alcohol sends it:
    // "us"/"uk" when the user tracks alcohol, null when they do not. Default
    // null, because that is the default account state and the state the
    // importer must never leak in.
    //
    // The macro widgets need it too, and for them null means something the
    // importer never has to model: their fixtures DO carry alcohol figures,
    // so passing null would say "tracking off" and hide the row outright.
    // They take `macroDrinkUnit`, which is the flag when set and "us"
    // otherwise — the server's own default for a tracking user with no saved
    // preference. `?drinkUnit=uk` is therefore the only way to see the
    // "1.6 UK units" gloss anywhere.
    const drinkUnitParam = params.get("drinkUnit");
    const drinkUnit =
        drinkUnitParam === "us" || drinkUnitParam === "uk"
            ? drinkUnitParam
            : null;
    const macroDrinkUnit = drinkUnit ?? "us";
    const ctx: FixtureCtx = {
        macroDrinkUnit,
        today: localToday(),
        pastYear: pastYearDate(),
    };
    const end = params.get("end");
    let results = buildResults(
        drinkUnit,
        macroDrinkUnit,
        end === "today"
            ? ctx.today
            : end === "pastYear"
              ? ctx.pastYear
              : END_DATE,
    );

    // Every recognised flag is echoed in the config line; an unknown VALUE is
    // said to be ignored rather than silently rendering the default, which
    // would look exactly like a variant that does nothing.
    const labels: string[] = [];
    for (const flag of FIXTURE_FLAGS) {
        const value = params.get(flag.name);
        if (value == null || flag.name === "drinkUnit") continue;
        if (!flag.values.includes(value)) {
            labels.push(`${flag.name}=unknown (ignored)`);
            continue;
        }
        labels.push(`${flag.name}=${value}`);
        flag.apply?.(results, value, ctx);
    }

    // ...except when you want to LOOK at the off state. `?alcohol=off` sends
    // the macro widgets exactly what the server sends a user who has not opted
    // in — drink_unit null and alcohol_g null on every total, day, goal and
    // meal row — so "the row is gone" is reviewable rather than only asserted.
    // Without it this state was unreachable here for every widget but
    // meal-logged, whose fixture hardcodes it: the strip's alcohol gate is the
    // one display rule that is a privacy promise, and it was the one you could
    // not see working. It runs after the variants so nothing they restore
    // (`?meals=1` puts alcohol-carrying rows back) escapes the walk.
    if (params.get("alcohol") === "off")
        results = blankMetric(
            results,
            BLANKED.alcohol.keys,
            BLANKED.alcohol.recordedDays,
        );
    // Caffeine's equivalent, and the DEFAULT state for anyone who has never
    // logged a coffee — which made it the more common of the two to be unable
    // to see.
    if (params.get("caffeine") === "none")
        results = blankMetric(
            results,
            BLANKED.caffeine.keys,
            BLANKED.caffeine.recordedDays,
        );

    // `?waterUnit=` (l | us_fl_oz | uk_fl_oz): what the server resolves from a
    // pounds-weighing profile (waterUnitFor, src/units.ts), so the fluid-ounce
    // reading is reviewable without an account set to lb. Applied to every
    // fixture that carries the field; an unknown value leaves the fixtures'.
    const waterParam = params.get("waterUnit");
    const waterUnit = (WATER_UNITS as readonly string[]).includes(
        waterParam ?? "",
    )
        ? waterParam
        : null;
    // `?locale=`. Every widget reads structuredContent.locale before anything
    // else (pickLocale, shared/i18n.js), so overriding the fixture's own field
    // is what actually switches the language; hostContext.locale is set to
    // match in the handshake, for any widget that falls back to it. An unknown
    // code is refused and said so in the config line — never echoed back raw,
    // and never quietly rendered in English.
    const localeParam = params.get("locale");
    const locale =
        localeParam && LOCALES.includes(localeParam) ? localeParam : null;
    for (const [widget, fixture] of Object.entries(results)) {
        if (waterUnit && "water_unit" in fixture)
            patch(results, widget, { water_unit: waterUnit });
        if (locale && "locale" in fixture) patch(results, widget, { locale });
    }
    return { results, drinkUnit, locale, waterUnit, labels };
}

// Which tool's outputSchema each widget's fixture must satisfy. component-gallery
// and any probe key are absent on purpose: no tool renders them.
const FIXTURE_TOOL: Record<string, string> = {
    "nutrition-summary": "get_nutrition_summary",
    "goal-progress": "get_goal_progress",
    "meal-logged": "log_meal",
    trends: "get_trends",
    "weight-trends": "get_weight_trends",
    "import-meals": "start_meal_import",
};

// Blank a metric out of a built fixture, exactly as the server would: the named
// fields wherever they appear — totals, per-day rows, goals, meal breakdowns —
// as a deep WALK rather than a per-widget edit, because the point is to prove
// NOTHING carries a figure and a hand-listed version nulls the fields someone
// remembered.
//
// `recordedDays` is the one place a null is wrong. `recorded_days` counts DAYS,
// not milligrams, and the two metrics differ there: the server nulls
// recorded_days.alcohol_g for a user who opted out (there is nothing to count),
// but caffeine's is a plain count that reads 0 when nobody logged any. Passing
// it in keeps that difference where it belongs — in the caller that knows which
// metric it is blanking — instead of hardcoding one metric's rule in the walk.
function blankMetric<T>(
    value: T,
    keys: readonly string[],
    recordedDays: number | null,
    parent = "",
): T {
    if (Array.isArray(value))
        return value.map((v) =>
            blankMetric(v, keys, recordedDays, parent),
        ) as unknown as T;
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = keys.includes(k)
                ? parent === "recorded_days"
                    ? recordedDays
                    : null
                : blankMetric(v, keys, recordedDays, k);
        }
        return out as T;
    }
    return value;
}

// The two states worth being able to LOOK at, and they are not the same kind of
// state. Alcohol's is a PREFERENCE — the user opted out, and the server nulls
// every alcohol field including the drink unit. Caffeine's is DATA — there is
// deliberately no caffeine_tracking_enabled anywhere on the tool surface (see
// the contract test in src/mcp.test.ts), so a null means nobody ever logged
// any, which is the ordinary state for most accounts rather than an opt-out.
const BLANKED = {
    alcohol: { keys: ["alcohol_g", "drink_unit"], recordedDays: null },
    caffeine: { keys: ["caffeine_mg"], recordedDays: 0 },
} as const;

// Cross-flag combinations worth validating on their own, beyond each flag
// alone: the ones a sign-off actually asks for (the empty card, a stale reading
// on a past-year day, a whole-empty series with no goals), and the ones where
// a later flag rewrites what an earlier one produced (`alcohol=on` then
// `meals=0` / `goals=none`).
const FIXTURE_COMBOS = [
    "logged=none&weight=none",
    "logged=none&weight=noreading",
    "day=pastYear&weight=stale",
    "day=today&meals=1",
    "meals=1&weight=notarget",
    "alcohol=on&meals=0",
    "alcohol=on&goals=none",
    "weights=single&target=none&range=30",
    "weights=none&end=pastYear",
    "days=gap7&goals=none&range=14",
    "days=sparse&end=today",
    "waterUnit=us_fl_oz&locale=uk",
] as const;

// Every query string whose payload gets validated: the default, each flag
// value alone, the combinations above — each of them crossed with every
// drink_unit branch and both blanking walks, because the fixtures differ by
// all three. drinkUnit, alcohol=off and caffeine=none are the grid's own axes,
// so they are not repeated as single variants.
function fixtureVariants(): string[] {
    const singles = FIXTURE_FLAGS.filter(
        (f) => f.name !== "drinkUnit" && f.name !== "caffeine",
    ).flatMap((f) =>
        f.values
            .filter((v) => !(f.name === "alcohol" && v === "off"))
            .map((v) => `${f.name}=${v}`),
    );
    // One real locale, and one that must be refused rather than echoed.
    const base = ["", ...singles, "locale=uk", "locale=xx", ...FIXTURE_COMBOS];
    const out: string[] = [];
    for (const drink of ["", "drinkUnit=us", "drinkUnit=uk"])
        for (const blank of ["", "alcohol=off", "caffeine=none"])
            for (const v of base) {
                // alcohol=on and alcohol=off are one parameter; a URL can
                // only carry one of them.
                if (blank === "alcohol=off" && v.includes("alcohol=")) continue;
                out.push([drink, blank, v].filter(Boolean).join("&"));
            }
    return out;
}

// A SCHEMA IS NOT COHERENCE. buildMealProgress (src/mcp.ts) builds the tile
// figures and the drawer rows from one getMealsByDate call, so on a real card
// the rows always sum to the figure above them and always contain the meal the
// header just announced. The fixture had drifted off both at once — totals
// typed beside a row set they no longer matched, and a header crediting a meal
// in none of its own drawers — while staying perfectly schema-valid, so the
// tiered layout and its drawers were reviewed against a card the server cannot
// send. Shape drift already aborts the harness; arithmetic drift now does too.
function checkMealProgressCoherence(
    fixture: Record<string, unknown> | undefined,
    query: string,
    problems: Set<string>,
): void {
    const rows = (fixture?.meals as Record<string, number | null>[]) ?? [];
    const totals = (fixture?.totals as Record<string, number | null>) ?? {};
    // `?meals=0` empties the breakdown on purpose, to review the static path:
    // with no rows there is nothing for the figures to disagree with.
    if (!rows.length) return;
    const where = `meal-logged (?${query || "default"})`;
    for (const [key, total] of Object.entries(totals)) {
        // Water has no meal behind it, and a null total means "not tracked".
        if (key === "water_ml" || total == null) continue;
        const summed =
            Math.round(
                rows.reduce((a, r) => a + (Number(r[key]) || 0), 0) * 10,
            ) / 10;
        if (Math.abs(summed - total) > 0.05)
            problems.add(
                `${where}: totals.${key} is ${total}, but its meals sum to ${summed}`,
            );
    }
    const logged = fixture?.logged_meal as { description?: string } | undefined;
    const named = logged?.description;
    if (
        named &&
        !rows.some((r) => (r as { description?: string }).description === named)
    )
        problems.add(
            `${where}: logged_meal "${named}" is in none of its own meal rows`,
        );
}

// Fail loudly at startup rather than serving a fixture that exercises fallback
// paths. Every variant is built through resolveFixtures(), the same function
// /host serves from, so there is no second code path that could apply an
// override the check never saw.
function assertFixturesMatchSchemas(): void {
    const schemas = collectOutputSchemas();
    // A Set: one stale field fails the same way under every drink unit, and
    // that is one problem to fix, not nine lines of output.
    const problems = new Set<string>();
    const variants = fixtureVariants();
    for (const query of variants) {
        // The `?alcohol=off` / `?caffeine=none` payloads are fixtures like any
        // other and get the same check — otherwise the two whose whole job is
        // to prove a field is ABSENT could go schema-invalid without anything
        // saying so. `recorded_days` is why that matters concretely: it counts
        // days, so caffeine blanks to 0 there and a null would not parse.
        const { results } = resolveFixtures(new URLSearchParams(query));
        // Shape is not arithmetic — see checkMealProgressCoherence.
        checkMealProgressCoherence(results["meal-logged"], query, problems);
        for (const [widget, toolName] of Object.entries(FIXTURE_TOOL)) {
            const schema = schemas.get(toolName);
            if (!schema) {
                problems.add(
                    `${widget}: ${toolName} declares no outputSchema (renamed tool?)`,
                );
                continue;
            }
            const fixture = results[widget];
            try {
                const parsed = schema.parse(fixture);
                // parse() succeeding is not enough: z.object() STRIPS unknown
                // keys rather than rejecting them, so a stale field survives
                // the parse and is simply gone by the time the widget renders.
                // droppedKeys() walks the whole tree for them.
                const extra = [...droppedKeys(fixture, parsed)];
                if (extra.length) {
                    problems.add(
                        `${widget}: field(s) not in ${toolName}'s outputSchema: ${extra.join(", ")}`,
                    );
                }
            } catch (err) {
                problems.add(
                    `${widget} (?${query || "default"}) fails ${toolName}'s outputSchema:\n    ${String(
                        err instanceof Error ? err.message : err,
                    )
                        .split("\n")
                        .join("\n    ")}`,
                );
            }
        }
    }
    if (problems.size) {
        console.error(
            `\nharness fixtures are not schema-valid:\n\n${[...problems].join("\n\n")}\n`,
        );
        process.exit(1);
    }
    console.log(
        `fixtures: ${variants.length} variants schema-valid for ${Object.keys(FIXTURE_TOOL).length} tools`,
    );
}

function hostPage(widget: string, params: URLSearchParams): string {
    const serverTools = params.get("serverTools") !== "0";
    const answerTools = params.get("tools") !== "0";
    const delay = Number(params.get("delay") ?? 0);
    const maxHeight = params.get("maxHeight");
    const failCalls = params.get("fail") === "1";

    // Per-widget canned tool results with every fixture flag applied — the
    // same resolveFixtures() call assertFixturesMatchSchemas validated.
    const { results, drinkUnit, locale, labels } = resolveFixtures(params);
    // Probe keys paint their own UI; anything non-null will do.
    const toolResult = results[widget] ?? { probe: true };
    const localeParam = params.get("locale");
    // One link per language, keeping every other flag already on the URL.
    const localeLinks = LOCALES.map((code) => {
        if (code === (locale ?? "en")) return `<b>${code}</b>`;
        const q = new URLSearchParams(params);
        q.set("locale", code);
        return `<a href="/host?${q}">${code}</a>`;
    }).join(" ");
    const localeCfg = locale
        ? `locale=${locale}`
        : localeParam
          ? "locale=unknown (using en)"
          : "locale=en";
    // One line per fixture flag that applies to THIS widget, each value a
    // link that keeps every other flag on the URL — so a variant is a click
    // away rather than something to remember the spelling of. Values are
    // FIXTURE_FLAGS' own, never the raw query, so nothing is echoed back.
    const variantLinks = FIXTURE_FLAGS.filter((f) => f.widgets.includes(widget))
        .map((f) => {
            const current = params.get(f.name);
            const cell = (value: string | null) => {
                const text = value ?? "default";
                if (
                    value === current ||
                    (value === null && !f.values.includes(current ?? ""))
                )
                    return `<b>${text}</b>`;
                const q = new URLSearchParams(params);
                if (value === null) q.delete(f.name);
                else q.set(f.name, value);
                return `<a href="/host?${q}">${text}</a>`;
            };
            return `<div>${f.name}: ${[null, ...f.values].map(cell).join(" ")}</div>`;
        })
        .join("");
    const hasRange =
        typeof toolResult === "object" && "default_range" in toolResult;

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>host: ${widget}</title>
<style>
  body{font:13px/1.5 -apple-system,system-ui,sans-serif;margin:16px}
  #frame{width:100%;height:130px;border:2px solid #888;border-radius:8px;transition:height .15s}
  #log{margin-top:12px;padding:8px;background:#111;color:#0f0;border-radius:6px;
       font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap;max-height:300px;overflow:auto}
  .cfg{color:#666}
  .variants{margin-top:4px;display:grid;gap:1px}
</style></head>
<body>
  <strong>${widget}</strong>
  <span class="cfg">serverTools=${serverTools} answerTools=${answerTools} delay=${delay}ms${maxHeight ? " maxHeight=" + maxHeight : ""}${failCalls ? " fail=1" : ""} drinkUnit=${drinkUnit ?? "null (tracking off)"} ${localeCfg}${labels.length ? " " + labels.join(" ") : ""}</span>
  <div class="cfg" style="margin-top:4px">language: ${localeLinks}</div>
  ${variantLinks ? `<div class="cfg variants">${variantLinks}</div>` : ""}
  <div style="margin-top:8px"><iframe id="frame" sandbox="allow-scripts" src="/widget/${encodeURIComponent(widget)}"></iframe></div>
  <div style="margin-top:8px">
    <button onclick="hostRequest(1)">host req id=1</button>
    <button onclick="hostRequest(2)">host req id=2</button>
    <button onclick="hostNotify('dark')">host-context-changed (dark)</button>
    <button onclick="hostNotify('light')">host-context-changed (light)</button>
    <button onclick="redeliver()">re-deliver tool-result</button>
    ${hasRange ? `<button onclick="redeliverNextRange()">re-deliver, next default_range</button>` : ""}
  </div>
  <div id="log">host ready — iframe starts at 130px and grows only on size-changed</div>
<script>
const CFG = {
  serverTools: ${serverTools},
  answerTools: ${answerTools},
  delay: ${delay},
  maxHeight: ${maxHeight ? Number(maxHeight) : "null"},
  fail: ${failCalls},
  locale: ${JSON.stringify(locale)},
};
const TOOL_RESULT = ${JSON.stringify(toolResult)};
const frame = document.getElementById("frame");
const logEl = document.getElementById("log");
const log = (m) => { logEl.textContent += "\\n" + m; logEl.scrollTop = logEl.scrollHeight; };
let initialized = false;

function send(msg) { frame.contentWindow.postMessage(msg, "*"); }

// A host->app REQUEST. The spec's ui/resource-teardown example uses id 1, which
// collides with the app's own first request unless the app namespaces its ids.
// The app must answer, and must NOT treat this as a response.
function hostRequest(id) {
  log("-> host REQUEST ui/resource-teardown (id " + id + ")");
  send({ jsonrpc: "2.0", id, method: "ui/resource-teardown", params: { reason: "test" } });
}
function hostNotify(theme) {
  log("-> host-context-changed theme=" + theme);
  send({ jsonrpc: "2.0", method: "ui/notifications/host-context-changed",
         params: { hostContext: { theme } } });
}

// A second tool-result into the SAME iframe, which is what a host does when
// the tool re-runs while the card is still on screen. Widgets must restore an
// open drawer, a pressed series and a focused control across it, and trends /
// weight-trends must keep the range the user picked unless the payload's own
// default_range changed — these two buttons are how those rules get looked at
// rather than taken on trust. "Same" re-sends whatever was last delivered.
let lastDelivered = TOOL_RESULT;
function deliver(sc, why) {
  lastDelivered = sc;
  send({ jsonrpc: "2.0", method: "ui/notifications/tool-result",
         params: { structuredContent: sc } });
  log("-> tool-result" + (why ? " (" + why + ")" : ""));
}
function redeliver() {
  if (!initialized) { log("!! not initialized yet; nothing delivered"); return; }
  deliver(lastDelivered, "re-delivered, same payload");
}
function redeliverNextRange() {
  if (!initialized) { log("!! not initialized yet; nothing delivered"); return; }
  const ranges = [7, 14, 30];
  const cur = lastDelivered.default_range;
  const next = ranges[(ranges.indexOf(cur) + 1) % ranges.length];
  deliver(Object.assign({}, lastDelivered, { default_range: next }),
          "re-delivered, default_range " + cur + " -> " + next);
}

window.addEventListener("message", (e) => {
  if (e.source !== frame.contentWindow) return;   // what bridge.js should also do
  const d = e.data;
  if (!d || typeof d !== "object") return;

  // ---- ui/initialize (strict: validate the request shape) ----
  if (d.method === "ui/initialize") {
    const p = d.params || {};
    const ok = p.protocolVersion && p.appInfo && p.appCapabilities;
    log("<- ui/initialize " + JSON.stringify(p.appInfo || null));
    if (!ok) {
      log("!! REJECTED: needs protocolVersion + appInfo + appCapabilities " +
          "(clientInfo/capabilities is the MCP-core shape and is wrong here)");
      return;
    }
    const hostContext = { theme: "light" };
    if (CFG.locale) hostContext.locale = CFG.locale;
    if (CFG.maxHeight) hostContext.containerDimensions = { maxHeight: CFG.maxHeight };
    const hostCapabilities = {};
    if (CFG.serverTools) hostCapabilities.serverTools = {};
    send({ jsonrpc: "2.0", id: d.id, result: {
      protocolVersion: "2026-01-26",
      hostInfo: { name: "local-harness", version: "1.0.0" },
      hostCapabilities, hostContext,
    }});
    return;
  }

  // ---- required before the host will deliver data ----
  if (d.method === "ui/notifications/initialized") {
    initialized = true;
    log("<- initialized");
    deliver(TOOL_RESULT);
    return;
  }

  // ---- height reporting ----
  if (d.method === "ui/notifications/size-changed") {
    const h = d.params && d.params.height;
    const capped = CFG.maxHeight ? Math.min(h, CFG.maxHeight) : h;
    frame.style.height = capped + "px";
    log("<- size-changed height=" + h + (capped !== h ? " (capped to " + capped + ")" : ""));
    return;
  }

  // ---- ui/update-model-context (a REQUEST, params.content ContentBlocks) ----
  if (d.method === "ui/update-model-context") {
    const p = d.params || {};
    const shapeOk = Array.isArray(p.content) || !!p.structuredContent;
    log("<- ui/update-model-context id=" + d.id + " shapeOk=" + shapeOk +
        " " + JSON.stringify(p).slice(0, 120));
    if (d.id != null) send({ jsonrpc: "2.0", id: d.id, result: {} });
    return;
  }

  // ---- app-initiated tools/call ----
  if (d.method === "tools/call") {
    const name = d.params && d.params.name;
    log("<- tools/call " + name + " (id " + d.id + ")");
    if (!initialized) log("!! app called a tool before the handshake finished");
    if (!CFG.answerTools) { log("   (answerTools=0: dropping, app should time out)"); return; }
    setTimeout(async () => {
      if (CFG.fail) {
        send({ jsonrpc: "2.0", id: d.id, error: { code: -32603, message: "harness: simulated failure" } });
        log("-> error for id " + d.id);
        return;
      }
      // bulk_import_meals runs for real, server-side, against an in-memory store.
      if (name === "bulk_import_meals") {
        // What the widget actually decided to send, before the server sees it:
        // the field list settles arguments like "is alcohol still written when
        // tracking is off?" by inspection rather than by belief.
        const rows = (d.params.arguments && d.params.arguments.meals) || [];
        const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        log("   " + rows.length + " rows, fields: " + fields.join(",") +
            " | alcohol_g on " + rows.filter((r) => r.alcohol_g != null).length + " row(s)");
        try {
          const r = await fetch("/tool/bulk_import_meals", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(d.params.arguments || {}),
          });
          const sc = await r.json();
          send({ jsonrpc: "2.0", id: d.id, result: {
            content: [{ type: "text", text: "see structuredContent" }],
            structuredContent: sc,
          }});
          log("-> real import result id " + d.id + ": status=" + sc.status +
              " created=" + sc.summary.created + " dedup=" + sc.summary.deduplicated +
              " failed=" + sc.summary.failed + (sc.dry_run ? " (dry run)" : ""));
        } catch (e) {
          send({ jsonrpc: "2.0", id: d.id, error: { code: -32603, message: String(e) } });
          log("-> error for id " + d.id + ": " + e);
        }
        return;
      }
      send({ jsonrpc: "2.0", id: d.id, result: {
        content: [{ type: "text", text: "harness canned result for " + name }],
        structuredContent: TOOL_RESULT,
      }});
      log("-> result for id " + d.id + (CFG.delay ? " after " + CFG.delay + "ms" : ""));
    }, CFG.delay);
    return;
  }

  // App answering one of OUR requests.
  if (d.id != null && d.method === undefined) {
    log("<- app answered id " + d.id + " " + JSON.stringify(d.result || d.error));
    return;
  }
  log("<- (unhandled) " + JSON.stringify(d).slice(0, 160));
});
</script>
</body></html>`;
}

// Before the first request, not on it: a drifted fixture must stop the harness,
// not quietly render a fallback path someone then signs a layout off on.
assertFixturesMatchSchemas();

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
            return new Response(indexPage(), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname === "/host") {
            const widget = url.searchParams.get("widget") ?? KEYS[0]!;
            if (!KEYS.includes(widget)) {
                return new Response(`unknown widget: ${widget}`, {
                    status: 404,
                });
            }
            return new Response(hostPage(widget, url.searchParams), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (
            url.pathname === "/tool/bulk_import_meals" &&
            req.method === "POST"
        ) {
            const args = (await req.json()) as Parameters<typeof runImport>[0];
            const result = await runImport(args, {
                userId: "harness-user",
                tz: "Europe/Kyiv",
                tzConfigured: true,
                nowMs: Date.now(),
                insert: fakeInsert,
                async existingKeys(keys) {
                    return new Set(keys.filter((k) => store.has(k)));
                },
                async existingMealIds(ids) {
                    return new Set(ids.filter((id) => byId.has(id)));
                },
            });
            return Response.json(result);
        }
        if (url.pathname === "/tool/reset" && req.method === "POST") {
            store.clear();
            byId.clear();
            mealSeq = 0;
            return Response.json({ ok: true, cleared: true });
        }
        if (url.pathname.startsWith("/widget/")) {
            const key = decodeURIComponent(
                url.pathname.slice("/widget/".length),
            );
            if (!KEYS.includes(key)) {
                return new Response(`unknown widget: ${key}`, { status: 404 });
            }
            // Same CSP the MCP Apps sandbox applies, so a widget that reaches
            // for the network here fails here too.
            return new Response(await getWidgetHtml(key), {
                headers: {
                    "content-type": "text/html; charset=utf-8",
                    "content-security-policy":
                        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:",
                },
            });
        }
        return new Response("not found", { status: 404 });
    },
});

console.log(`widget harness on http://localhost:${PORT}`);
console.log(`widgets: ${KEYS.join(", ")}`);
