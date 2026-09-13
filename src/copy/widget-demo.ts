// The demo payloads the landing page's widget cards are rendered from: the
// hero's summary card and the examples carousel's eight.
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
    DrinkUnit,
    GoalProgressPayload,
    MealProgressPayload,
    StartImportPayload,
    SummaryPayload,
    TrendsPayload,
    WeightTrendsPayload,
    WidgetGoals,
    WidgetMealRow,
    WidgetTotals,
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
    /** Grams of ethanol. Read only by the examples' meal-logged builder, and
     *  only when that card's drink unit says alcohol tracking is on — exactly
     *  as the server gates it (mealBreakdown / totalsPayloadOf). */
    alc?: number;
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

// ---- The examples slides' cards -------------------------------------------
//
// The landing page's examples carousel is ten short conversations, and eight of
// them call a tool that returns a widget: log_meal (four times),
// get_goal_progress, get_trends (DEMO_TRENDS above), get_weight_trends and
// start_meal_import. The builders below produce those tools' structuredContent
// from the figures each conversation states — and from nothing else, so the
// reply beside a card and the card itself cannot disagree.
//
// Meal DESCRIPTIONS are still the caller's: they are the user's own words and
// the page translates them (see the note at the top of this file). Everything
// else here is numbers, dates and enum values.

/** Each examples conversation is its own day.
 *
 *  Two real cards on one page that name the SAME day must state the same totals
 *  for it, and these conversations do not share a day's meals — a breakfast-only
 *  card and a lunch-only card on one date would be two different accounts of
 *  that date. So every slide that shows a dated card gets a date of its own,
 *  none of them inside the trends window (2025-08-09 … DEMO_TRENDS_END_DATE) or
 *  on the hero's DEMO_SUMMARY_DATE, and all in a PAST year for the reason given
 *  at the top of this file.
 *
 *  The ORDER matters in one place: the goal-progress card reports the latest
 *  weigh-in overall, which is the one the weight-trend conversation logged, so
 *  that day comes first. */
export const DEMO_EXAMPLE_DATES = {
    "weight-trend": "2025-09-12",
    "goals-progress": "2025-09-13",
    "log-meal": "2025-09-15",
    "photo-meal": "2025-09-16",
    "scan-barcode": "2025-09-17",
    "track-drinks": "2025-09-19",
    "import-history": "2025-09-22",
} as const;

/** Tenths, as the server rounds every gram figure it sends. */
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** A `meals[]` row, as mealBreakdown (src/mcp.ts) builds one for a single-day
 *  card: no date (the card labels rows by meal type), integers for calories,
 *  tenths for grams, alcohol only while tracking is on (0 on a meal without
 *  any), and caffeine null unless this meal carried a figure. */
function exampleMealRow(m: DemoMealInput, drinkUnit: DrinkUnit): WidgetMealRow {
    return {
        description: m.description,
        meal_type: m.meal_type,
        date: null,
        calories: Math.round(num(m.add.kcal)),
        protein_g: round1(num(m.add.pro)),
        carbs_g: round1(num(m.add.car)),
        fat_g: round1(num(m.add.fat)),
        fiber_g: round1(num(m.add.fib)),
        sugar_g: round1(num(m.add.sugar)),
        alcohol_g: drinkUnit ? round1(num(m.add.alc)) : null,
        caffeine_mg: m.add.caf == null ? null : round1(m.add.caf),
    };
}

/** A day's totals, as totalsPayloadOf builds them: the meals summed, water
 *  beside them, alcohol only while tracking is on, and caffeine null unless
 *  some meal on the day carried a figure (a 0 there would claim a measured
 *  caffeine-free day). */
function exampleDayTotals(
    meals: readonly DemoMealInput[],
    waterMl: number,
    drinkUnit: DrinkUnit,
): WidgetTotals {
    const sum = (k: keyof DemoAdd) =>
        meals.reduce((t, m) => t + num(m.add[k]), 0);
    return {
        calories: Math.round(sum("kcal")),
        protein_g: round1(sum("pro")),
        carbs_g: round1(sum("car")),
        fat_g: round1(sum("fat")),
        fiber_g: round1(sum("fib")),
        sugar_g: round1(sum("sugar")),
        alcohol_g: drinkUnit ? round1(sum("alc")) : null,
        caffeine_mg: meals.some((m) => m.add.caf != null)
            ? round1(sum("caf"))
            : null,
        water_ml: waterMl,
    };
}

/** The log_meal / update_meal payload (buildMealProgress in src/mcp.ts).
 *
 *  `logged` is the meal the tool call just wrote; `dayMeals` is every meal on
 *  that date at the moment of the call, `logged` included — the totals are
 *  that list summed, so they can never disagree with the rows behind them.
 *  Water logged LATER in the conversation is not in `waterMl`: the card is the
 *  day as it stood when log_meal returned.
 *
 *  `drinkUnit` is the account's alcohol setting: null (tracking off) for every
 *  demo conversation except the one that turns it on. */
export function demoMealLoggedPayload(opts: {
    date: string;
    logged: DemoMealInput;
    dayMeals?: readonly DemoMealInput[];
    waterMl?: number;
    drinkUnit?: DrinkUnit;
    action?: "logged" | "updated";
    locale: string;
}): MealProgressPayload {
    const dayMeals = opts.dayMeals ?? [opts.logged];
    if (!dayMeals.includes(opts.logged)) {
        throw new Error(
            "demoMealLoggedPayload: dayMeals must contain the logged meal — the card's strip is that day's totals, the logged meal among them",
        );
    }
    const drinkUnit = opts.drinkUnit ?? null;
    const add = opts.logged.add;
    return {
        action: opts.action ?? "logged",
        date: opts.date,
        drink_unit: drinkUnit,
        water_unit: DEMO_WATER_UNIT,
        locale: opts.locale,
        logged_meal: {
            description: opts.logged.description,
            meal_type: opts.logged.meal_type,
            calories: add.kcal ?? null,
            protein_g: add.pro ?? null,
            carbs_g: add.car ?? null,
            fat_g: add.fat ?? null,
            fiber_g: add.fib ?? null,
            sugar_g: add.sugar ?? null,
            alcohol_g: drinkUnit ? (add.alc ?? null) : null,
            caffeine_mg: add.caf ?? null,
        },
        // goalsPayloadOf passes the stored alcohol goal through, and the demo
        // account has none — so DEMO_GOALS as it is, even with tracking on.
        has_goals: true,
        goals: DEMO_GOALS,
        totals: exampleDayTotals(dayMeals, opts.waterMl ?? 0, drinkUnit),
        meals: dayMeals.map((m) => exampleMealRow(m, drinkUnit)),
    };
}

/** What each meal-logging conversation logs, as the chat states it. Every
 *  figure the reply quotes is here; carbs, fat and sugar where the reply is
 *  silent are chosen so the macros add up to the calories within a few kcal.
 *
 *  Each is the only entry on its own day (DEMO_EXAMPLE_DATES), so its card's
 *  totals are that one meal and the water bar reads empty — the water the
 *  log-meal conversation logs comes in a LATER turn, through log_water, which
 *  returns no widget. */
export const DEMO_EXAMPLE_MEALS = {
    // Oatmeal with berries and a coffee: the coffee's 95 mg is why caffeine
    // shows.
    "log-meal": {
        meal_type: "breakfast",
        add: {
            kcal: 320,
            pro: 11,
            car: 56,
            fat: 6,
            fib: 6,
            sugar: 12,
            caf: 95,
        },
        drinkUnit: null,
    },
    // Beef borscht with sour cream and rye bread. No caffeine figure, so no
    // caffeine tile.
    "photo-meal": {
        meal_type: "lunch",
        add: { kcal: 470, pro: 24, car: 43, fat: 22, fib: 7, sugar: 10 },
        drinkUnit: null,
    },
    // A 330 ml can of Coca-Cola (barcode 5449000000996): 139 kcal and 35 g
    // sugar from Open Food Facts, 32 mg caffeine from the maker's own figure,
    // and a measured 0 for everything a soft drink has none of.
    "scan-barcode": {
        meal_type: "lunch",
        add: {
            kcal: 139,
            pro: 0,
            car: 35,
            fat: 0,
            fib: 0,
            sugar: 35,
            caf: 32,
        },
        drinkUnit: null,
    },
    // A UK pint (568 ml) of 4% lager: 568 × 0.04 × 0.789 = 17.9 g of ethanol.
    // The conversation has just turned alcohol tracking on in UK units, so
    // this is the one card with a drink unit — and the alcohol tile.
    "track-drinks": {
        meal_type: "dinner",
        add: {
            kcal: 180,
            pro: 2,
            car: 12,
            fat: 0,
            fib: 0,
            sugar: 0,
            alc: 17.9,
        },
        drinkUnit: "uk",
    },
} as const satisfies Record<
    string,
    {
        meal_type: DemoMealInput["meal_type"];
        add: DemoAdd;
        drinkUnit: DrinkUnit;
    }
>;

export type DemoExampleMealSlide = keyof typeof DEMO_EXAMPLE_MEALS;

/** The meal-logged card behind one of the four meal-logging conversations,
 *  with the caller's localized `description` for the meal. */
export function demoExampleMealLogged(
    slide: DemoExampleMealSlide,
    description: string,
    locale: string,
): MealProgressPayload {
    const spec = DEMO_EXAMPLE_MEALS[slide];
    const logged: DemoMealInput = {
        description,
        meal_type: spec.meal_type,
        add: spec.add,
    };
    return demoMealLoggedPayload({
        date: DEMO_EXAMPLE_DATES[slide],
        logged,
        drinkUnit: spec.drinkUnit,
        locale,
    });
}

/** The demo account's weight: the weigh-in the weight-trend conversation logs,
 *  against its target. The goal-progress card reports the same reading. */
export const DEMO_WEIGHT = {
    current: 78.4,
    target: 75,
    unit: "kg",
    logged_on: DEMO_EXAMPLE_DATES["weight-trend"],
} as const;

/** The four meals behind the goal-progress card, in the order they were
 *  eaten, without their descriptions (the caller's, localized). They sum to
 *  exactly what the conversation's reply quotes — 1,540 kcal and 104 g protein,
 *  so 460 kcal and 56 g left of DEMO_GOALS' 2,000 and 160 — and the flat white
 *  is where the day's caffeine came from. */
export const DEMO_GOAL_PROGRESS_MEALS = [
    {
        meal_type: "breakfast",
        add: { kcal: 420, pro: 24, car: 52, fat: 12, fib: 5, sugar: 22 },
    },
    {
        meal_type: "lunch",
        add: { kcal: 610, pro: 46, car: 58, fat: 20, fib: 7, sugar: 6 },
    },
    {
        meal_type: "snack",
        add: { kcal: 110, pro: 6, car: 9, fat: 6, fib: 0, sugar: 9, caf: 130 },
    },
    {
        meal_type: "dinner",
        add: { kcal: 400, pro: 28, car: 53, fat: 10, fib: 8, sugar: 3 },
    },
] as const satisfies readonly Omit<DemoMealInput, "description">[];

/** Water on the goal-progress day: 1.5 L across three entries. */
export const DEMO_GOAL_PROGRESS_WATER = { ml: 1500, entries: 3 } as const;

/** The get_goal_progress payload behind the goals conversation.
 *  `descriptions` are the four meals' localized descriptions, in
 *  DEMO_GOAL_PROGRESS_MEALS order. */
export function demoGoalProgressPayload(
    descriptions: readonly string[],
    locale: string,
): GoalProgressPayload {
    if (descriptions.length !== DEMO_GOAL_PROGRESS_MEALS.length) {
        throw new Error(
            `demoGoalProgressPayload: ${DEMO_GOAL_PROGRESS_MEALS.length} meal descriptions expected, got ${descriptions.length}`,
        );
    }
    const meals: DemoMealInput[] = DEMO_GOAL_PROGRESS_MEALS.map((m, i) => ({
        description: descriptions[i]!,
        meal_type: m.meal_type,
        add: m.add,
    }));
    return {
        date: DEMO_EXAMPLE_DATES["goals-progress"],
        meal_count: meals.length,
        water_entries: DEMO_GOAL_PROGRESS_WATER.entries,
        drink_unit: DEMO_DRINK_UNIT,
        water_unit: DEMO_WATER_UNIT,
        locale,
        goals: DEMO_GOALS,
        totals: exampleDayTotals(meals, DEMO_GOAL_PROGRESS_WATER.ml, null),
        // The tool sends a weight whenever there is a reading or a target;
        // this account has both.
        weight: { ...DEMO_WEIGHT },
        meals: meals.map((m) => exampleMealRow(m, null)),
    };
}

/** The weigh-ins behind the weight-trends card: [days before the end date,
 *  kg]. Twelve in the 30-day window, chosen so the card and the reply quote
 *  the same things — the first reading in the window is 80.2 (so "−1.8 kg"),
 *  the last is today's 78.4 (so "3.4 kg to lose" against 75), and the four in
 *  the trailing seven days average exactly 78.7 (the reply's 7-day average,
 *  which computeWeightTrend takes over the readings in those days). */
const DEMO_WEIGHT_READINGS: readonly (readonly [
    daysBack: number,
    kg: number,
])[] = [
    [29, 80.2],
    [26, 80.0],
    [23, 79.9],
    [20, 79.6],
    [17, 79.5],
    [14, 79.3],
    [11, 79.1],
    [8, 79.0],
    [6, 78.9],
    [4, 78.8],
    [2, 78.7],
    [0, DEMO_WEIGHT.current],
];

/** `iso` moved `delta` whole UTC days. */
function shiftIso(iso: string, delta: number): string {
    const t = Date.parse(`${iso}T00:00:00Z`) + delta * 86_400_000;
    return new Date(t).toISOString().slice(0, 10);
}

/** The get_weight_trends payload behind the weight conversation: the tool
 *  called with no arguments, so the default 30-day window ending on the day of
 *  the weigh-in the conversation logged. */
export function demoWeightTrendsPayload(locale: string): WeightTrendsPayload {
    const end = DEMO_WEIGHT.logged_on;
    return {
        end_date: end,
        unit: DEMO_WEIGHT.unit,
        target: DEMO_WEIGHT.target,
        default_range: 30,
        locale,
        days: DEMO_WEIGHT_READINGS.map(([back, kg]) => ({
            date: shiftIso(end, -back),
            weight: kg,
        })),
    };
}

/** The start_meal_import payload behind the import conversation, opened after
 *  the timezone was set — so `tz_configured` is true and the first step carries
 *  no timezone warning. Everything but the timezone, the day and the locale is
 *  the server's own constant; validateDemoPayload compares them against
 *  startImportPayload (src/mcp.ts) so they cannot drift. */
export function demoStartImportPayload(locale: string): StartImportPayload {
    return {
        tz: "America/Chicago",
        tz_configured: true,
        today: DEMO_EXAMPLE_DATES["import-history"],
        max_rows_per_call: 50,
        import_tool_name: "bulk_import_meals",
        known_source_apps: [
            "myfitnesspal",
            "cronometer",
            "loseit",
            "macrofactor",
        ],
        widgets_enabled: true,
        drink_unit: DEMO_DRINK_UNIT,
        locale,
    };
}

// ---- The guard ------------------------------------------------------------

/** The tools a demo payload can stand in for. */
export type DemoTool =
    | "get_nutrition_summary"
    | "get_trends"
    | "log_meal"
    | "update_meal"
    | "get_goal_progress"
    | "get_weight_trends"
    | "start_meal_import";

// Registering all 36 tools to read their schemas back is not free, and a
// generator validates dozens of payloads — once per process is enough.
let schemasOnce: Promise<{
    schemas: Map<string, { parse(v: unknown): unknown }>;
    droppedKeys: (a: unknown, b: unknown) => Set<string>;
}> | null = null;

function liveSchemas() {
    schemasOnce ??= import("../widget-schemas.js").then((m) => ({
        schemas: m.collectOutputSchemas(),
        droppedKeys: (a: unknown, b: unknown) => m.droppedKeys(a, b),
    }));
    return schemasOnce;
}

/** Parse ONE payload against `tool`'s real outputSchema and throw on the first
 *  discrepancy — a missing or mistyped field, or a key parse() silently strips
 *  (see validateDemoPayloads below for why both). For start_meal_import it
 *  also checks every server constant in the payload against what
 *  startImportPayload actually sends. Pass what you RENDER. */
export async function validateDemoPayload(
    tool: DemoTool,
    payload: unknown,
): Promise<void> {
    const { schemas, droppedKeys } = await liveSchemas();
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
    if (tool === "start_meal_import") {
        const p = payload as StartImportPayload;
        // Dynamic for the same reason widget-schemas.js is (see below).
        const { startImportPayload } = await import("../mcp.js");
        const real = startImportPayload({
            tz: p.tz,
            tzConfigured: p.tz_configured,
            widgetsEnabled: p.widgets_enabled,
            alcohol: p.drink_unit,
            locale: p.locale,
        }) as Record<string, unknown>;
        for (const [key, value] of Object.entries(real)) {
            // The server's `today` is the real clock's; the demo's is fixed.
            if (key === "today") continue;
            const demo = (p as unknown as Record<string, unknown>)[key];
            if (JSON.stringify(demo) !== JSON.stringify(value)) {
                throw new Error(
                    `landing-page demo payload for start_meal_import says ${key}=${JSON.stringify(demo)}, but the server sends ${JSON.stringify(value)}`,
                );
            }
        }
    }
}

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
    await validateDemoPayload("get_nutrition_summary", summary);
    await validateDemoPayload("get_trends", trends);
}
