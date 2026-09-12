// The demo payloads the landing page's two widget cards are rendered from.
//
// LOCALE-INDEPENDENT, on purpose and by construction: this file holds numbers,
// payload keys and fixed calendar dates, and not one string a visitor reads.
// Every word on those cards — the title, the metric names, the unit symbols,
// the "7-day avg · all days" label, the date range, the "7 days logged"
// caption, the meal-type words in the drawer — comes out of WIDGET_STRINGS
// (src/copy/widgets.ts) at render time, in the site locale the page is being
// generated in. That is the whole point of rendering the REAL cards instead of
// mocking them up: the nine landing pages get nine correctly translated cards
// from one payload, instead of nine hand-written approximations that drift
// (the German mockup said "Kohlenhydrate" where the widget abbreviates to
// "Kohlenh."; the Japanese one said "糖類" where the widget says "糖質").
//
// The one string this file cannot supply is a MEAL DESCRIPTION: "Oatmeal with
// berries and a flat white" is the user's own text, and the landing page's
// copy translates it per locale. So demoSummaryPayload takes the meal rows as
// an argument — the caller (scripts/gen-index.ts) has the localized IndexDoc,
// and this module maps that caller's hero-chat `add` keys onto the tool's
// payload keys and fills in everything else.
//
// FIXED DATES, NEVER BUILD-DATE-RELATIVE. A date derived from `new Date()`
// would rewrite all nine index.html files on every generator run and make
// cross-locale tests depend on what day they are run. The dates below are in a
// PAST calendar year deliberately: rangeNeedsYear (shared/date.js) prints the
// year whenever a range is not in the current one, so a past year renders the
// same bytes for ever, whereas a current-year date would silently grow a year
// on the next 1 January and churn the output then. They are safe to bump when
// they start to read as stale — bump them, re-run scripts/gen-index.ts, and
// update src/widget-static.test.ts's date expectations together.
//
// EVERYTHING HERE IS CHECKED AGAINST THE LIVE TOOL SCHEMAS by
// validateDemoPayloads() below. The harness fixtures drifted exactly this way
// before — they sent `range_days` where the tool sends `default_range` — and
// a payload the widget silently never receives renders a card that silently
// falls back.

import type {
    SummaryPayload,
    TrendsPayload,
    WidgetGoals,
    WidgetMealRow,
    WidgetTrendsDay,
} from "../widget-static.js";

// ---- Dates ----------------------------------------------------------------

/** The hero chat's "today": the single day its summary card covers. One day
 *  later than the trends window ends, so the two cards on the page tell one
 *  coherent story — last week in review, today still in progress — instead of
 *  disagreeing about what the same date's totals were. */
export const DEMO_SUMMARY_DATE = "2025-09-08";

/** The last day of the trends series — the window ENDS here whichever toggle
 *  position the card opens on, and the 30 days behind it run back to
 *  2025-08-09. The landing page opens the card on 14 (LANDING_TRENDS_RANGE in
 *  scripts/gen-index.ts, which is the number the page's own prose quotes), so
 *  what a visitor first sees is 2025-08-25 … 2025-09-07. */
export const DEMO_TRENDS_END_DATE = "2025-09-07";

/** This payload's own `default_range` — the window a CLIENT would open on if
 *  it were handed this object untouched. One of shared/trends-card.js's
 *  RANGES; the payload carries all 30 days whatever it is, because the runtime
 *  re-slices client-side when the toggle is used.
 *
 *  NOT what the landing page renders: scripts/gen-index.ts overrides it with
 *  LANDING_TRENDS_RANGE, so the pressed button, the embedded JSON and the
 *  runtime's fallback all say the same number. Both values are legal here:
 *  DEMO_TRENDS_ROWS carries all 30 days and every window reads correctly. */
export const DEMO_TRENDS_RANGE = 7;

// ---- The demo account -----------------------------------------------------

/** THE demo account's daily goals — one set, shared by both cards, because
 *  one account has one set of goals and two cards on one page saying otherwise
 *  is the kind of detail a reader notices.
 *
 *  This is the single source of truth that replaces three copies of the same
 *  numbers: `WIDGET_GOALS` and `KCAL_GOAL` in scripts/gen-index.ts (the
 *  mockup's bar goals and its ring's 2,000) and the hand-localized
 *  `hero.chat.widget.goal` string ("goal 2,000") in src/copy/index.ts and its
 *  eight translations. Format `DEMO_GOALS.calories` per locale rather than
 *  writing the digits out in copy.
 *
 *  `fiber_g` is 30 g, the figure most guidelines land on, and it is the one
 *  goal whose two cards currently disagree: the trends series records fiber on
 *  every logged day, but the hero thread's exchanges carry no `fib` in their
 *  `add` maps yet (see DemoAdd), so the hero card's fiber tile reads "none
 *  logged" until they do. That is an honest state — a missing value is not a
 *  zero — but it is not the state this demo wants; adding `fib` to the hero
 *  exchanges in all nine IndexDoc files is what finishes it, and nothing else
 *  here has to change when they do.
 *
 *  `alcohol_g` is null because alcohol tracking is off for this account, which
 *  is also what `drink_unit: null` says on both payloads. */
export const DEMO_GOALS: WidgetGoals = {
    calories: 2000,
    protein_g: 160,
    carbs_g: 220,
    fat_g: 70,
    fiber_g: 30,
    sugar_g: 60,
    alcohol_g: null,
    caffeine_mg: 400,
    water_ml: 2500,
};

/** Alcohol tracking is off, so no payload carries a standard-drink convention
 *  and no alcohol tile is drawn. */
const DEMO_DRINK_UNIT = null;

/** Litres. `waterUnitFor` (src/units.ts) picks fluid ounces for a profile that
 *  weighs in pounds; the demo account is metric. */
const DEMO_WATER_UNIT = "l" as const;

/** The payload's own `locale` field is NOT what decides the card's language
 *  here. In chat the widget resolves it with pickLocale(structuredContent.locale,
 *  hostContext.locale); at build time the page's language is known outright
 *  and renderSummaryCard/renderTrendsCard call setLocale() with it directly.
 *  The field is carried because the tools' outputSchemas require it and these
 *  payloads are parsed against those schemas. */
const DEMO_PAYLOAD_LOCALE = "en";

// ---- The hero chat's nutrient deltas --------------------------------------

/** The hero chat's own delta shape (`HeroExchange.add` in src/copy/index.ts):
 *  short keys, every one optional, an exchange supplying only what it logged.
 *
 *  `fib` is the one key the hero exchanges do not supply yet. It is declared
 *  and wired through demoSummaryPayload anyway, so lighting fiber up on the
 *  hero card is a pure copy edit — a `fib` beside each exchange's `sugar`, in
 *  src/copy/index.ts and its eight translations (plus `fib` in gen-index.ts's
 *  `Totals`, which sums these keys by name). Until then the card's fiber tile
 *  reads "none logged" against DEMO_GOALS' 30 g, which is what the payload
 *  honestly says. */
export interface DemoAdd {
    kcal?: number;
    pro?: number;
    car?: number;
    fat?: number;
    water?: number;
    fib?: number;
    sugar?: number;
    caf?: number;
}

/** One meal behind the hero chat's summary card: the caller's LOCALIZED
 *  description and meal type, plus that exchange's own `add` deltas.
 *
 *  `meal_type` must be one of the server's enum values — "breakfast", "lunch",
 *  "dinner", "snack" — or null. It is translated at render time by
 *  mealTypeLabel (shared/macros.js), which falls back to the raw string, so a
 *  pre-translated value would print the same word in all nine locales.
 *
 *  Pass only exchanges that logged a MEAL. A water exchange is not one: no
 *  meal carries water_ml, so a water row would sit in the drawer reading 0
 *  kcal under every metric. */
export interface DemoMealInput {
    description: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack" | null;
    add: DemoAdd;
}

/** A recorded reading, or null for "nobody recorded this".
 *
 *  The distinction is load-bearing for caffeine, fiber and sugar: a 0 against a
 *  400 mg limit claims the user measured a caffeine-free day, which is issue
 *  #78's whole subject, while null suppresses the tile. The hero's `add` maps
 *  omit a nutrient an exchange did not log, so "absent or zero" is exactly
 *  "not recorded" here. */
const recorded = (n: number | undefined): number | null =>
    n != null && n > 0 ? n : null;

const num = (n: number | undefined): number => n ?? 0;

/** The get_nutrition_summary payload behind the hero chat's card: a SINGLE
 *  day, because the chat's last question is "How am I doing today?".
 *
 *  Note that a one-day window draws no sparkline — summaryCharted needs two
 *  logged days before a line means anything — so this card is the ring, the
 *  three tiered rails and the drawer. The chart on the page is the trends
 *  card's.
 *
 *  `totals` is the hero thread's accumulated deltas (every exchange's `add`
 *  summed, water included); `meals` is the food exchanges, in order. The two
 *  overlap deliberately: `totals` is what the landing script replays as the
 *  thread plays out, and the meals are what the drawer opens onto. */
export function demoSummaryPayload(
    totals: DemoAdd,
    meals: DemoMealInput[],
): SummaryPayload {
    const day = {
        date: DEMO_SUMMARY_DATE,
        calories: num(totals.kcal),
        protein_g: num(totals.pro),
        carbs_g: num(totals.car),
        fat_g: num(totals.fat),
        // Nullable on a day row, so the honest value for a nutrient nobody
        // logged is null rather than a measured zero.
        fiber_g: recorded(totals.fib),
        sugar_g: recorded(totals.sugar),
        alcohol_g: null,
        caffeine_mg: recorded(totals.caf),
        water_ml: num(totals.water),
        meal_count: meals.length,
    };
    return {
        start_date: DEMO_SUMMARY_DATE,
        end_date: DEMO_SUMMARY_DATE,
        logged_days: 1,
        days_in_range: 1,
        drink_unit: DEMO_DRINK_UNIT,
        water_unit: DEMO_WATER_UNIT,
        locale: DEMO_PAYLOAD_LOCALE,
        goals: DEMO_GOALS,
        // TOTALS_ITEM, where fiber and sugar are plain numbers: a range's
        // averages always state a figure, and `recorded_days` below is how a
        // consumer sees whether anything stands behind one.
        averages: {
            calories: day.calories,
            protein_g: day.protein_g,
            carbs_g: day.carbs_g,
            fat_g: day.fat_g,
            fiber_g: num(totals.fib),
            sugar_g: num(totals.sugar),
            alcohol_g: null,
            caffeine_mg: day.caffeine_mg,
            water_ml: day.water_ml,
        },
        recorded_days: {
            fiber_g: day.fiber_g == null ? 0 : 1,
            sugar_g: day.sugar_g == null ? 0 : 1,
            alcohol_g: null,
            caffeine_mg: day.caffeine_mg == null ? 0 : 1,
        },
        days: [day],
        meals: meals.map((m): WidgetMealRow => ({
            description: m.description,
            meal_type: m.meal_type,
            date: DEMO_SUMMARY_DATE,
            calories: num(m.add.kcal),
            protein_g: num(m.add.pro),
            carbs_g: num(m.add.car),
            fat_g: num(m.add.fat),
            fiber_g: num(m.add.fib),
            sugar_g: num(m.add.sugar),
            alcohol_g: null,
            caffeine_mg: recorded(m.add.caf),
        })),
    };
}

// ---- The trends series ----------------------------------------------------

/** One day of the demo series: [date, calories, protein_g, carbs_g, fat_g,
 *  fiber_g, sugar_g, caffeine_mg, water_ml].
 *
 *  A row whose calories are 0 is a day the account did not log at all — every
 *  other figure on it is 0 or null and dayHasData (shared/macros.js) counts it
 *  out of "N of M days logged". There are two of them, placed so that each
 *  window of the toggle tells a different true story: 7 of 7 days logged in
 *  the narrowest window, 13 of 14 (what the landing page opens on), 28 of 30.
 *
 *  The last seven rows are chosen to average to exact round figures over the
 *  7-day window — 1,940 kcal, 150 g protein, 200 g carbs, 68 g fat, 52 g
 *  sugar, 160 mg caffeine, 2,200 ml water — so the card's own arithmetic is
 *  checkable by hand and the test can assert printed figures without
 *  reproducing avgOf.
 *
 *  FIBER is the one column that averages to the same round figure — 28 g — in
 *  all three windows, which takes a little arranging and is worth it: fiber
 *  averages only over the days that recorded it ("· days recorded", see avgOf
 *  in shared/trends-card.js), a different denominator from calories', and an
 *  identical answer under both rules is the clearest way to show that both are
 *  working. Every logged day carries a figure, because the server is explicit
 *  that a meal without fiber records "nobody measured this" rather than a
 *  zero, and a demo that quietly omitted it would be showing a less complete
 *  card than the product produces. */
type DemoTrendsRow = readonly [
    date: string,
    calories: number,
    protein_g: number,
    carbs_g: number,
    fat_g: number,
    fiber_g: number,
    sugar_g: number,
    caffeine_mg: number,
    water_ml: number,
];

const DEMO_TRENDS_ROWS: readonly DemoTrendsRow[] = [
    ["2025-08-09", 2210, 166, 232, 74, 31.4, 63, 150, 2400],
    ["2025-08-10", 1980, 152, 206, 68, 28.5, 51, 170, 2200],
    ["2025-08-11", 1740, 134, 178, 61, 22.9, 40, 120, 1900],
    ["2025-08-12", 2060, 158, 218, 70, 29.6, 57, 190, 2500],
    ["2025-08-13", 1890, 145, 196, 65, 26.2, 46, 130, 2100],
    ["2025-08-14", 2320, 174, 248, 79, 33.8, 71, 210, 2700],
    ["2025-08-15", 1810, 140, 186, 62, 24.1, 44, 110, 2000],
    // Not logged.
    ["2025-08-16", 0, 0, 0, 0, 0, 0, 0, 0],
    ["2025-08-17", 2150, 163, 224, 72, 30.4, 60, 180, 2350],
    ["2025-08-18", 1920, 149, 200, 66, 27.2, 48, 160, 2150],
    ["2025-08-19", 2040, 156, 212, 69, 29.3, 54, 140, 2450],
    ["2025-08-20", 1680, 130, 174, 58, 22.0, 39, 100, 1850],
    ["2025-08-21", 2270, 171, 240, 76, 32.6, 68, 200, 2600],
    ["2025-08-22", 1960, 151, 204, 67, 27.8, 50, 155, 2250],
    ["2025-08-23", 2110, 160, 220, 71, 30.6, 59, 175, 2400],
    ["2025-08-24", 1770, 136, 180, 60, 23.6, 41, 125, 1950],
    // The 14-day window the landing page opens on starts here.
    ["2025-08-25", 2030, 155, 210, 69, 28.2, 53, 165, 2300],
    ["2025-08-26", 1850, 143, 192, 63, 25.4, 45, 135, 2050],
    ["2025-08-27", 2190, 165, 230, 73, 30.7, 62, 185, 2550],
    // Not logged.
    ["2025-08-28", 0, 0, 0, 0, 0, 0, 0, 0],
    ["2025-08-29", 1900, 147, 198, 66, 26.1, 47, 145, 2100],
    ["2025-08-30", 2240, 168, 236, 75, 33.0, 65, 195, 2650],
    ["2025-08-31", 1830, 141, 188, 62, 24.6, 43, 115, 2000],
    // The 7-day window starts here.
    ["2025-09-01", 2080, 158, 214, 72, 29.8, 58, 180, 2300],
    ["2025-09-02", 1890, 146, 198, 64, 26.0, 44, 150, 2100],
    ["2025-09-03", 2140, 162, 226, 71, 31.1, 61, 210, 2600],
    ["2025-09-04", 1760, 138, 182, 60, 24.6, 38, 120, 1800],
    ["2025-09-05", 2210, 170, 236, 74, 33.5, 66, 190, 2500],
    ["2025-09-06", 1650, 128, 172, 56, 23.1, 42, 140, 1900],
    ["2025-09-07", 1850, 148, 172, 79, 27.9, 55, 130, 2200],
];

function demoTrendsDay(row: DemoTrendsRow): WidgetTrendsDay {
    const [
        date,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber,
        sugar,
        caffeine,
        water,
    ] = row;
    const logged = calories > 0;
    return {
        date,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        // Null, not 0, on a day nothing was logged: a 0 would claim a measured
        // fiber-free day and drag the "· days recorded" average down with it.
        fiber_g: logged ? fiber : null,
        sugar_g: logged ? sugar : null,
        // Alcohol tracking is off.
        alcohol_g: null,
        caffeine_mg: logged ? caffeine : null,
        water_ml: water,
    };
}

/** The get_trends payload behind the examples slide's card: 30 days of daily
 *  series, so all three toggle positions have real data to re-average. */
export const DEMO_TRENDS: TrendsPayload = {
    end_date: DEMO_TRENDS_END_DATE,
    default_range: DEMO_TRENDS_RANGE,
    drink_unit: DEMO_DRINK_UNIT,
    water_unit: DEMO_WATER_UNIT,
    locale: DEMO_PAYLOAD_LOCALE,
    goals: DEMO_GOALS,
    days: DEMO_TRENDS_ROWS.map(demoTrendsDay),
};

// ---- The guard ------------------------------------------------------------

/** Parse both payloads against the tools' REAL outputSchemas and throw on the
 *  first discrepancy. Call it before rendering — scripts/gen-index.ts does,
 *  the way scripts/widget-harness.ts calls assertFixturesMatchSchemas() before
 *  serving anything.
 *
 *  PASS WHAT YOU RENDER, not what you started from. Both arguments are taken
 *  rather than read off this module because neither payload reaches a card
 *  unaltered: the summary's meal rows carry the caller's localized
 *  descriptions, and the trends payload is re-stamped with the page's locale
 *  and the window the card opens on (trendsCardPayload in
 *  scripts/gen-index.ts). Validating the canonical DEMO_TRENDS instead of that
 *  spread checks an object nobody renders — and since `z.object()` STRIPS
 *  unknown keys rather than rejecting them, a field added or renamed in the
 *  spread would be validated nowhere and silently dropped on the way to the
 *  widget. `trends` therefore defaults to DEMO_TRENDS only for a caller that
 *  really does render it unchanged.
 *
 *  Two failures are caught, and only one of them is an exception Zod raises on
 *  its own:
 *    * a MISSING or mistyped field — `.parse()` throws;
 *    * a STALE field — `z.object()` strips unknown keys instead of rejecting
 *      them, at every depth, so a renamed key survives the parse and simply
 *      never reaches the widget. droppedKeys() (src/widget-schemas.ts) walks
 *      both objects and names what vanished.
 *
 *  The summary payload is passed in rather than built here: its meal rows
 *  carry the caller's localized descriptions (see demoSummaryPayload).
 *
 *  src/widget-schemas.ts is imported DYNAMICALLY. It stands up a throwaway
 *  McpServer and registers all 36 tools to read their schemas back, which
 *  drags in src/mcp.ts and the whole server behind it — a static import here
 *  would put that on anything that merely wanted these numbers, and would make
 *  a data module in src/copy/ a route into the request path it documents
 *  itself as staying out of. */
export async function validateDemoPayloads(
    summary: SummaryPayload,
    trends: TrendsPayload = DEMO_TRENDS,
): Promise<void> {
    const { collectOutputSchemas, droppedKeys } =
        await import("../widget-schemas.js");
    const schemas = collectOutputSchemas();
    const cases: [tool: string, payload: unknown][] = [
        ["get_nutrition_summary", summary],
        ["get_trends", trends],
    ];
    for (const [tool, payload] of cases) {
        const schema = schemas.get(tool);
        if (!schema) {
            throw new Error(
                `${tool} has no outputSchema — the landing page's demo payload has nothing to validate against`,
            );
        }
        let parsed: unknown;
        try {
            parsed = schema.parse(payload);
        } catch (err) {
            throw new Error(
                `landing-page demo payload for ${tool} does not match its outputSchema: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            );
        }
        const dropped = [...droppedKeys(payload, parsed)];
        if (dropped.length) {
            throw new Error(
                `landing-page demo payload for ${tool} carries ${dropped.length} key(s) the tool does not send, ` +
                    `which parse() silently strips: ${dropped.join(", ")}`,
            );
        }
    }
}
