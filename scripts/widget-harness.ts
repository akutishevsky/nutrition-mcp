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
//   ?noMeta=1           deliver the tool result WITHOUT its _meta, as a host that
//                       drops it would (nutrition-summary then shows "N or more",
//                       weight-trends falls back to its legacy 7/14/30 chart,
//                       and every macro strip loses its added-sugar cell and
//                       its ingredient expanders — exactly the strip from
//                       before those fields existed)
//   ?meals=0            goal-progress: no per-meal rows, so the strip takes its
//                       static path (no tile is a button, no hint)
//   ?sample=sparse      weight-trends: a 3-weigh-in user instead of 3 years of
//                       history (the degraded states: no rate chip, no 1y/All)
//   ?days=90            weight-trends: the tool's `days` argument, which picks
//                       structuredContent.default_range (7/14/30/90/365, else 30)
//   ?unit=lb            weight-trends: display unit (default kg)
//   ?target=0           weight-trends: no target weight set
//   ?groupBy=week       trends: the `group_by` the period view opens on
//                       (week/month/quarter/year, default month); ?noMeta=1
//                       shows the plain 7/14/30 day view, as without group_by
//   ?goals=0            trends: no goals history at all (averages only)
//   ?locale=pl          structuredContent.locale (and hostContext.locale)
//   ?addedSugar=unrecorded  a 29 g added-sugar limit and NO recorded figure:
//                       meal-logged / goal-progress show the day a 330 ml cola
//                       was logged with sugar_g 35 and no added_sugar_g; the
//                       summary and trends get every day unrecorded. The
//                       added-sugar cell reads "not recorded" over the limit.
//   ?addedSugar=zero    the same limit with a recorded 0 g (an apple and a
//                       diet cola; 0 g on every summary/trends day): the cell
//                       reads "0", never "none logged"
//   ?saturatedFat=1    the fixture meals carry saturated and trans fat (a
//                       mix of recorded, zero and not-recorded values) and a
//                       20 g saturated-fat ceiling reaches the summary and the
//                       day widgets through the saturated-fat `_meta`
//   ?theme=dark         hostContext.theme on ui/initialize (default light)
//   ?sources=1          the nutrient-sources `_meta` (built by the server's own
//                       buildNutrientSourcesMeta) on nutrition-summary,
//                       goal-progress and meal-logged: USDA, OFF, yours, est.
//                       and a mixed tag, a meal and an ingredient with tags, a
//                       null value that gets no tag, and an alcohol tag that
//                       meal-logged (tracking off) drops. Ignored with
//                       ?addedSugar= edge rows, which have no ingredients.
//
// Nothing here is served by the production app; scripts/ is dev-only.

import { addedSugarExtra, buildAddedSugarMeta } from "../src/added-sugar.js";
import { buildMealItemsMeta, type MealItemValues } from "../src/meal-items.js";
import {
    buildSaturatedFatMeta,
    saturatedFatExtra,
    transFatExtra,
} from "../src/saturated-fat.js";
import {
    ADDED_SUGAR_META_KEY,
    getWidgetHtml,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_ITEMS_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
    PERIOD_AVERAGES_META_KEY,
    SATURATED_FAT_META_KEY,
    WEIGHT_SERIES_META_KEY,
    WIDGET_TEMPLATES,
} from "../src/widgets.js";
import {
    buildNutrientSourcesMeta,
    type NutrientSources,
    type SourceDetail,
} from "../src/provenance.js";
import { runImport } from "../src/import.js";
import { buildDailyBuckets } from "../src/insights.js";
import {
    buildPeriodAveragesMeta,
    dayTotalsFromMeals,
    GRANULARITIES,
    yearSpanStart,
    type Granularity,
} from "../src/periods.js";
import {
    GOAL_COLUMNS,
    type NutritionGoalsHistoryRow,
} from "../src/goals-history.js";
import type {
    Meal,
    MealInput,
    MealInsertResult,
    WaterEntry,
} from "../src/supabase.js";
import { shiftLocalDate } from "../src/tz.js";
import { fromGrams, type WeightUnit } from "../src/units.js";
import {
    analyzeWeightHistory,
    defaultRangeFor,
    type WeightRow,
} from "../src/weight-trend.js";

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

// get_weight_trends' tool result, built with the REAL src/weight-trend.ts the
// handler uses (EWMA, buckets, rate), so what the widget draws here is what a
// client would get for the same weigh-ins — not a hand-typed approximation.
// "full" is ~3 years losing 92 → 80 kg with a plateau, day-to-day noise, a
// three-week break and a few double weigh-ins; "sparse" is 3 weigh-ins in a
// month, which is too few for a rate and too short for 1y/All.
const WEIGHT_END = "2026-07-15";
const WEIGHT_TZ = "Europe/Kyiv";
function weightRows(sample: "full" | "sparse"): WeightRow[] {
    const at = (date: string, hh = "07:30") => `${date}T${hh}:00+03:00`;
    if (sample === "sparse") {
        return [
            {
                logged_at: at(shiftLocalDate(WEIGHT_END, -24)),
                weight_g: 84_300,
            },
            {
                logged_at: at(shiftLocalDate(WEIGHT_END, -11)),
                weight_g: 83_600,
            },
            { logged_at: at(shiftLocalDate(WEIGHT_END, -2)), weight_g: 83_900 },
        ];
    }
    // Deterministic noise (mulberry32), so every reload draws the same chart.
    let seed = 20261004;
    const rand = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const total = 3 * 365;
    const rows: WeightRow[] = [];
    for (let i = total; i >= 0; i--) {
        const date = shiftLocalDate(WEIGHT_END, -i);
        const p = (total - i) / total; // 0 → 1 over the history
        // Loses fast, plateaus through the middle, then a slower second leg.
        const base =
            p < 0.35
                ? 92 - (p / 0.35) * 7
                : p < 0.6
                  ? 85 + Math.sin(p * 40) * 0.4
                  : 85 - ((p - 0.6) / 0.4) * 5;
        if (i > 200 && i < 222) continue; // a three-week break
        if (rand() < 0.3) continue; // skipped mornings
        const kg = base + (rand() - 0.5) * 1.6;
        rows.push({ logged_at: at(date), weight_g: Math.round(kg * 1000) });
        if (rand() < 0.05) {
            rows.push({
                logged_at: at(date, "21:10"),
                weight_g: Math.round((kg + 0.6) * 1000),
            });
        }
    }
    return rows;
}
function weightTrendsFixture(params: URLSearchParams) {
    const sample = params.get("sample") === "sparse" ? "sparse" : "full";
    const unit: WeightUnit = params.get("unit") === "lb" ? "lb" : "kg";
    const days = Number(params.get("days") ?? 30) || 30;
    const targetG = params.get("target") === "0" ? null : 78_000;
    const a = analyzeWeightHistory(
        weightRows(sample),
        WEIGHT_TZ,
        unit,
        WEIGHT_END,
    );
    const cutoff = shiftLocalDate(WEIGHT_END, -29);
    return {
        result: {
            end_date: WEIGHT_END,
            unit,
            target: targetG != null ? fromGrams(targetG, unit) : null,
            default_range: defaultRangeFor(days),
            locale: params.get("locale") ?? "en",
            days: a.days
                .filter((d) => d.date >= cutoff)
                .map((d) => ({
                    date: d.date,
                    weight: fromGrams(d.weight_g, unit),
                })),
        },
        meta: { [WEIGHT_SERIES_META_KEY]: a.meta },
    };
}

// get_trends' tool result, with the period `_meta` built by the REAL
// src/periods.ts the handler uses. Two years of meals in Kyiv ending
// TRENDS_END, with: one goal change (and goals history starting a few months
// in, so the oldest rows read "targets before … not recorded"), a three-week
// break (inner empty weeks are kept), unlogged days, water-only days (never
// "logged") and snack-only days (logged, flagged possibly incomplete).
const TRENDS_END = "2026-07-15";
const TRENDS_TZ = "Europe/Kyiv";
function goalsRow(
    effective_at: string,
    v: [number, number, number, number],
): NutritionGoalsHistoryRow {
    const row = Object.fromEntries(GOAL_COLUMNS.map((c) => [c, null])) as {
        [K in (typeof GOAL_COLUMNS)[number]]: number | null;
    };
    row.daily_calories = v[0];
    row.daily_protein_g = v[1];
    row.daily_carbs_g = v[2];
    row.daily_fat_g = v[3];
    row.daily_fiber_g = 30;
    row.daily_added_sugar_g = 25;
    row.daily_water_ml = 2500;
    return { effective_at, ...row };
}
// Meals before this date carry no added-sugar figure, so the 30-day window
// mixes recorded and unrecorded days and the 7/14/30 averages differ in how
// many days they divide by.
const ADDED_SUGAR_FROM = "2026-06-25";
const TRENDS_HISTORY: NutritionGoalsHistoryRow[] = [
    goalsRow("2024-10-02T09:12:00Z", [2400, 150, 280, 80]),
    goalsRow("2026-02-18T18:40:00Z", [2200, 160, 220, 70]),
];
function trendsSample(): { meals: Meal[]; water: WaterEntry[] } {
    let seed = 20261005;
    const rand = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const meals: Meal[] = [];
    const water: WaterEntry[] = [];
    let n = 0;
    const meal = (
        date: string,
        hh: string,
        type: string,
        kcal: number,
    ): Meal => ({
        id: `m${++n}`,
        user_id: "harness",
        saved_meal_id: null,
        logged_at: `${date}T${hh}:00+03:00`,
        meal_type: type,
        description: type,
        calories: Math.round(kcal),
        protein_g: Math.round(kcal * (0.065 + rand() * 0.02)),
        carbs_g: Math.round(kcal * (0.1 + rand() * 0.03)),
        fat_g: Math.round(kcal * (0.028 + rand() * 0.01)),
        fiber_g: Math.round(kcal * 0.012 * 10) / 10,
        sugar_g: Math.round(kcal * 0.025 * 10) / 10,
        // No rand() here: a new draw would shift every figure after it. Set
        // from the meal type instead (sweetened coffee at breakfast, a sweet
        // snack), and null before the cut-off below, like meals logged before
        // the column existed.
        added_sugar_g:
            date < ADDED_SUGAR_FROM
                ? null
                : type === "breakfast"
                  ? 8
                  : type === "snack"
                    ? Math.round(kcal * 0.015 * 10) / 10
                    : 0,
        alcohol_g: null,
        caffeine_mg: type === "breakfast" ? 95 : null,
        notes: null,
        idempotency_key: null,
    });
    const sip = (date: string, ml: number): WaterEntry => ({
        id: `w${++n}`,
        user_id: "harness",
        amount_ml: ml,
        logged_at: `${date}T10:00:00+03:00`,
        notes: null,
        created_at: `${date}T10:00:00+03:00`,
        idempotency_key: null,
    });
    const total = 2 * 365;
    for (let i = total; i >= 0; i--) {
        const date = shiftLocalDate(TRENDS_END, -i);
        if (i > 120 && i < 142) continue; // a three-week break
        const r = rand();
        if (r < 0.12) continue; // unlogged
        water.push(sip(date, 1500 + Math.round(rand() * 1000)));
        if (r < 0.17) continue; // water-only: never a logged day
        // The oldest two months were backfilled as calorie-only day totals:
        // their period rows show a dash for each macro, never 0 g.
        if (i > total - 60) {
            meals.push({
                ...meal(date, "20:00", "dinner", 1800 + rand() * 900),
                protein_g: null,
                carbs_g: null,
                fat_g: null,
            });
            continue;
        }
        if (r < 0.22) {
            meals.push(meal(date, "16:00", "snack", 250 + rand() * 300));
            continue; // snack-only: logged, possibly incomplete
        }
        // Eats more under the first (higher) goal, tightens after the change.
        const base = date < "2026-02-18" ? 2350 : 2150;
        const day = base + (rand() - 0.5) * 700;
        meals.push(meal(date, "08:15", "breakfast", day * 0.27));
        meals.push(meal(date, "13:30", "lunch", day * 0.37));
        meals.push(meal(date, "19:45", "dinner", day * 0.32));
        if (rand() < 0.5) meals.push(meal(date, "16:30", "snack", day * 0.08));
    }
    return { meals, water };
}
const r1 = (v: number) => Math.round(v * 10) / 10;
function trendsFixture(params: URLSearchParams, drinkUnit: "us" | "uk") {
    const { meals, water } = trendsSample();
    const history = params.get("goals") === "0" ? [] : TRENDS_HISTORY;
    const gb = params.get("groupBy") as Granularity | null;
    const groupBy: Granularity =
        gb && GRANULARITIES.includes(gb) ? gb : "month";
    const start = shiftLocalDate(TRENDS_END, -29);
    // structuredContent: get_trends' current (frozen) shape. The days mirror
    // trendsDayPayloadOf closely enough for a preview (rounded totals,
    // fiber/sugar null on a day no meal recorded them, caffeine likewise).
    const buckets = buildDailyBuckets(
        meals,
        water,
        start,
        TRENDS_END,
        TRENDS_TZ,
    );
    const days = buckets.map((b) => {
        const carries = (k: "fiber_g" | "sugar_g" | "caffeine_mg") =>
            b.meals.some((m) => m[k] != null);
        return {
            date: b.date,
            calories: Math.round(b.calories),
            protein_g: r1(b.protein_g),
            carbs_g: r1(b.carbs_g),
            fat_g: r1(b.fat_g),
            fiber_g: carries("fiber_g") ? r1(b.fiber_g) : null,
            sugar_g: carries("sugar_g") ? r1(b.sugar_g) : null,
            alcohol_g: null, // no meal records alcohol here
            caffeine_mg: carries("caffeine_mg")
                ? Math.round(b.caffeine_mg)
                : null,
            water_ml: Math.round(b.waterMl),
        };
    });
    const g = history[history.length - 1];
    const meta = buildPeriodAveragesMeta(
        dayTotalsFromMeals(
            meals,
            yearSpanStart(TRENDS_END),
            TRENDS_END,
            TRENDS_TZ,
        ),
        history,
        TRENDS_END,
        groupBy,
        TRENDS_TZ,
    );
    return {
        result: {
            end_date: TRENDS_END,
            default_range: 30,
            drink_unit: drinkUnit,
            locale: params.get("locale") ?? "en",
            goals: g
                ? {
                      calories: g.daily_calories,
                      protein_g: g.daily_protein_g,
                      carbs_g: g.daily_carbs_g,
                      fat_g: g.daily_fat_g,
                      fiber_g: g.daily_fiber_g,
                      sugar_g: g.daily_sugar_g,
                      alcohol_g: g.daily_alcohol_g,
                      caffeine_mg: g.daily_caffeine_mg,
                      water_ml: g.daily_water_ml,
                  }
                : null,
            days,
        },
        meta: {
            [PERIOD_AVERAGES_META_KEY]: meta,
            // get_trends' added-sugar series: the same 30 days, which the
            // widget re-averages per 7/14/30 range.
            [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                goal: g ? g.daily_added_sugar_g : null,
                days: Object.fromEntries(buckets.map((b) => [b.date, b.meals])),
            }),
        },
    };
}

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const KEYS = Object.keys(WIDGET_TEMPLATES);

function indexPage(): string {
    const links = KEYS.map(
        (k) =>
            `<li><a href="/host?widget=${encodeURIComponent(k)}">${k}</a></li>`,
    ).join("");
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Widget harness</title>
<style>
  body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:32px;max-width:760px}
  code{background:#eee;padding:1px 4px;border-radius:3px}
  li{margin:4px 0}
</style></head>
<body>
  <h1>MCP Apps widget harness</h1>
  <p>Pick a widget. Append query flags to simulate host behaviour:
     <code>?serverTools=0</code>, <code>?tools=0</code>, <code>?delay=3000</code>,
     <code>?maxHeight=600</code>, <code>?fail=1</code>, <code>?drinkUnit=us</code>,
     <code>?noMeta=1</code>, <code>?theme=dark</code>, <code>?locale=pl</code>,
     <code>?addedSugar=unrecorded</code>, <code>?addedSugar=zero</code>;
     goal-progress takes <code>?meals=0</code> (the static strip);
     weight-trends also takes <code>?sample=sparse</code>, <code>?days=90</code>,
     <code>?unit=lb</code>, <code>?target=0</code>; trends takes
     <code>?groupBy=week</code> and <code>?goals=0</code>.</p>
  <ul>${links}</ul>
</body></html>`;
}

function hostPage(widget: string, params: URLSearchParams): string {
    const serverTools = params.get("serverTools") !== "0";
    const answerTools = params.get("tools") !== "0";
    const delay = Number(params.get("delay") ?? 0);
    const maxHeight = params.get("maxHeight");
    const failCalls = params.get("fail") === "1";
    // A host that forwards structuredContent but not the result's _meta. The
    // summary's per-metric meal counts travel ONLY in _meta (structuredContent
    // is validated against a cached outputSchema and can never gain a field),
    // so this is how the "N or more smaller meals" fallback is previewed.
    const noMeta = params.get("noMeta") === "1";
    // goal-progress with no per-meal rows: the strip's static path.
    const staticGoalProgress = params.get("meals") === "0";
    const theme = params.get("theme") === "dark" ? "dark" : "light";
    const locale = params.get("locale");
    // The alcohol opt-in, as every tool that touches alcohol sends it:
    // "us"/"uk" when the user tracks alcohol, null when they do not. Default
    // null, because that is the default account state and the state the
    // importer must never leak in.
    //
    // The macro widgets need it too, and for them null means something the
    // importer never has to model: their fixtures below DO carry alcohol
    // figures, so passing null would say "tracking off" and hide the row
    // outright. They take `macroDrinkUnit`, which is the flag when set and
    // "us" otherwise — the server's own default for a tracking user with no
    // saved preference. `?drinkUnit=uk` is therefore the only way to see the
    // "1.6 UK units" gloss anywhere.
    const drinkUnitParam = params.get("drinkUnit");
    const drinkUnit =
        drinkUnitParam === "us" || drinkUnitParam === "uk"
            ? drinkUnitParam
            : null;
    const macroDrinkUnit = drinkUnit ?? "us";

    // Per-widget canned tool results. One shared fixture does NOT work: each
    // widget's coerce() checks for its own shape, so a payload shaped for
    // goal-progress leaves trends stuck on "Loading…" — which looks exactly like
    // a broken handshake. Keep these in step with each template's SAMPLE.
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
    const days = [
        day("2026-07-09", 1980),
        day("2026-07-10", 2210),
        day("2026-07-11", 1875),
        day("2026-07-12", 2340),
        day("2026-07-13", 2050),
        day("2026-07-14", 1920),
        day("2026-07-15", 2160),
    ];
    const goals = {
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
    const totals = {
        calories: 1850,
        protein_g: 120,
        carbs_g: 190,
        fat_g: 62,
        fiber_g: 24.6,
        // Over its ceiling, so the sub-row inside the carbs disclosure flags it.
        sugar_g: 61.3,
        alcohol_g: 27.7,
        // Over its ceiling too, so the stat line flags it.
        caffeine_mg: 470,
        water_ml: 1500,
    };
    // Per-meal breakdown rows: what makes the panel's tiles tappable.
    const meals = [
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
    const mealsNoAlcohol = meals.map((m) => ({ ...m, alcohol_g: null }));

    // The summary spans a week, so it gets more rows than the widget's CAP (8)
    // — enough that its lists overflow and the "N more" line is on screen.
    const extraSummaryMeals = [
        ["Greek yogurt & honey", "breakfast", 240, 17, 30, 6, 0, 26],
        ["Turkey wrap", "lunch", 480, 34, 44, 17, 5.1, 4.2],
        ["Lentil soup", "dinner", 390, 22, 55, 8, 14.2, 6.8],
        ["Apple", "snack", 95, 0.5, 25, 0.3, 4.4, 19],
        ["Protein bar", "snack", 210, 20, 23, 7, 3, 6.5],
        ["Beef stir-fry", "dinner", 610, 44, 48, 24, 5.6, 11.3],
        ["Banana", "snack", 105, 1.3, 27, 0.4, 3.1, 14.4],
    ] as const;
    const summaryMeals = [
        ...meals,
        ...extraSummaryMeals.map(
            ([
                description,
                meal_type,
                calories,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                sugar_g,
            ]) => ({
                description,
                meal_type,
                date: null,
                calories,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                sugar_g,
                alcohol_g: 0,
                caffeine_mg: null,
            }),
        ),
    ].map((m, i) => ({ ...m, date: days[i % days.length]!.date }));
    // A meal the server trimmed from `meals` that still leads added sugar:
    // a lemonade small enough to be in no other metric's top 8 (its 6.6 g of
    // sugar is ninth), yet second by added sugar. It reaches the widget only
    // through the added-sugar `_meta`'s `extra`, so the added-sugar list shows
    // it second while the sugar and calorie lists never do.
    const trimmedLemonade = {
        description: "Lemonade",
        meal_type: "snack",
        date: days[2]!.date,
        calories: 28,
        protein_g: 0,
        carbs_g: 7,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 6.6,
        alcohol_g: 0,
        caffeine_mg: null,
    };
    // What get_nutrition_summary sends in the result's _meta under
    // MEAL_CONTRIBUTORS_META_KEY: per metric, how many meals had a value above
    // zero. Two more meals than are listed contributed calories and the three
    // macros — the server trimmed them, being outside every metric's top 8 —
    // and so did the lemonade above, so the counts run past the rows exactly
    // as a real trimmed payload does.
    const TRIMMED = new Set(["calories", "protein_g", "carbs_g", "fat_g"]);
    const summaryMeta = {
        [MEAL_CONTRIBUTORS_META_KEY]: Object.fromEntries(
            (
                [
                    "calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "alcohol_g",
                    "caffeine_mg",
                ] as const
            ).map((k) => [
                k,
                summaryMeals.filter((m) => (m[k] ?? 0) > 0).length +
                    (TRIMMED.has(k) ? 2 : 0) +
                    ((trimmedLemonade[k] ?? 0) > 0 ? 1 : 0),
            ]),
        ),
    };
    // Added sugar per fixture meal, by description: the sweetened ones only.
    // Feeds buildAddedSugarMeta (src/added-sugar.ts) — the server's own
    // builder — through Meal rows made from the breakdown rows below, in the
    // same order, since the widget joins `_meta.meals` to them by position.
    const ADDED: Record<string, number> = {
        "Overnight oats with berries": 6.5,
        "Salmon with quinoa & veg": 2.1,
        "Greek yogurt & honey": 14,
        "Turkey wrap": 1.5,
        "Protein bar": 5,
        "Beef stir-fry": 6,
        Lemonade: 6.6,
    };
    // ?saturatedFat=1: a mix of recorded, zero and not-recorded fats by row
    // index, so the strip's fats cells show a list, a count and a gap.
    const satMode = params.get("saturatedFat") === "1";
    const asMeal = (
        row: { description: string; date: string | null } & Record<
            string,
            unknown
        >,
        i: number,
    ): Meal => ({
        id: `harness-meal-${i}`,
        user_id: "harness",
        saved_meal_id: null,
        logged_at: `${row.date ?? "2026-07-15"}T12:00:00+03:00`,
        meal_type: (row.meal_type as string | null) ?? null,
        description: row.description,
        calories: row.calories as number,
        protein_g: row.protein_g as number,
        carbs_g: row.carbs_g as number,
        fat_g: row.fat_g as number,
        fiber_g: row.fiber_g as number,
        sugar_g: row.sugar_g as number,
        // The espresso has no figure at all: recorded as nothing, it stays out
        // of the cell's breakdown rather than reading "0 g".
        added_sugar_g:
            row.description === "Double espresso"
                ? null
                : (ADDED[row.description] ?? 0),
        alcohol_g: (row.alcohol_g as number | null) ?? null,
        caffeine_mg: (row.caffeine_mg as number | null) ?? null,
        saturated_fat_g: satMode
            ? ([4.2, 0, 11.5, null] as const)[i % 4]!
            : null,
        trans_fat_g: satMode ? ([0.3, 0, null, 0.9] as const)[i % 4]! : null,
        notes: null,
        idempotency_key: null,
    });
    // One day for the single-day widgets: the four breakdown meals.
    const dayMeals = meals.map((m, i) => asMeal(m, i));
    const dayAddedSugar = buildAddedSugarMeta({
        goal: 25,
        days: { "2026-07-15": dayMeals },
        meals: dayMeals,
    });
    const summaryMealRows = summaryMeals.map((m, i) => asMeal(m, i));
    // Every meal of the window: the listed rows (indices 0…n-1, the "kept"
    // ones) then the lemonade the server trimmed.
    const windowRows = [...summaryMeals, trimmedLemonade];
    const windowMeals = windowRows.map((m, i) => asMeal(m, i));
    const summaryAddedSugar = buildAddedSugarMeta({
        goal: 25,
        days: Object.fromEntries(
            days.map((d) => [
                d.date,
                windowMeals.filter((m) => m.logged_at.startsWith(d.date)),
            ]),
        ),
        meals: summaryMealRows,
        // The two meals the server trimmed (see TRIMMED below) had no added
        // sugar; the lemonade did, so it counts here and arrives as `extra`.
        contributorsOf: windowMeals,
        // The server's own ranking (src/added-sugar.ts) and cap.
        extra: addedSugarExtra(
            windowMeals,
            windowRows,
            summaryMeals.map((_, i) => i),
            MEAL_BREAKDOWN_TOP_N,
        ),
    });

    // The saturated-fat `_meta`, built with the server's own builders from the
    // same rows as the added-sugar payloads. The summary's extra rows are the
    // meals the kept rows miss, as on the server.
    const dayFats = buildSaturatedFatMeta({
        goal: 20,
        days: { "2026-07-15": dayMeals },
        meals: dayMeals,
    });
    const summaryFats = buildSaturatedFatMeta({
        goal: 20,
        days: Object.fromEntries(
            days.map((d) => [
                d.date,
                windowMeals.filter((m) => m.logged_at.startsWith(d.date)),
            ]),
        ),
        meals: summaryMealRows,
        contributorsOf: windowMeals,
        extra: saturatedFatExtra(
            windowMeals,
            windowRows,
            summaryMeals.map((_, i) => i),
            MEAL_BREAKDOWN_TOP_N,
        ),
        transExtra: transFatExtra(
            windowMeals,
            windowRows,
            summaryMeals.map((_, i) => i),
            MEAL_BREAKDOWN_TOP_N,
        ),
    });

    // Ingredients behind a few fixture meals, by description, for the
    // breakdown's expandable rows: Cyrillic names, an item with no fiber
    // figure (shows "–") beside one with a recorded 0 (shows "0"), and a wine
    // whose alcohol the server nulls when tracking is off. The oats and the
    // espresso have none, so their rows keep the plain markup. Fed through
    // buildMealItemsMeta (src/meal-items.ts) — the server's own builder —
    // keyed by the same Meal rows the added-sugar meta uses, in row order.
    const ingredient = (
        position: number,
        name: string,
        amount: number | null,
        unit: string | null,
        v: Partial<MealItemValues>,
    ): MealItemValues => ({
        position,
        name,
        amount,
        unit,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...v,
    });
    const ITEMS: Record<string, MealItemValues[]> = {
        "Grilled chicken & rice bowl": [
            ingredient(1, "Рис басмати", 180, "g", {
                calories: 234,
                protein_g: 4.9,
                carbs_g: 51,
                fat_g: 0.5,
                fiber_g: 1.1,
                sugar_g: 0.2,
                added_sugar_g: 0,
            }),
            ingredient(2, "Куряче філе гриль", 200, "g", {
                calories: 330,
                protein_g: 46,
                carbs_g: 0,
                fat_g: 7.2,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            }),
            ingredient(3, "Соус теріякі", 30, "g", {
                calories: 38,
                protein_g: 0.5,
                carbs_g: 23.4,
                fat_g: 0,
                sugar_g: 8.4,
                added_sugar_g: 6.5,
            }),
            ingredient(4, "Едамаме", 40, "g", {
                calories: 48,
                protein_g: 0.6,
                carbs_g: 3.6,
                fat_g: 8.3,
                fiber_g: 5.1,
                sugar_g: 0.8,
                added_sugar_g: 0,
            }),
        ],
        "Salmon with quinoa & veg": [
            ingredient(1, "Salmon fillet", 150, "g", {
                calories: 312,
                protein_g: 30,
                carbs_g: 0,
                fat_g: 20,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            }),
            ingredient(2, "Quinoa, cooked", 150, "g", {
                calories: 180,
                protein_g: 6.6,
                carbs_g: 32,
                fat_g: 2.9,
                fiber_g: 4.2,
                sugar_g: 1.3,
                added_sugar_g: 0,
            }),
            ingredient(
                3,
                "Roasted vegetables with a long olive-oil glaze",
                150,
                "g",
                {
                    calories: 138,
                    protein_g: 19.4,
                    carbs_g: 40.6,
                    fat_g: 9.1,
                    fiber_g: 3.7,
                    sugar_g: 12.4,
                    added_sugar_g: 2.1,
                },
            ),
            ingredient(4, "Red wine", 250, "ml", {
                calories: 150,
                protein_g: 0,
                carbs_g: 4.4,
                fat_g: 0,
                fiber_g: 0,
                sugar_g: 1,
                added_sugar_g: 0,
                alcohol_g: 27.7,
            }),
        ],
        "Beef stir-fry": [
            ingredient(1, "Яловичина", 150, "g", {
                calories: 330,
                protein_g: 36,
                carbs_g: 0,
                fat_g: 20,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            }),
            ingredient(2, "Локшина удон", 200, "g", {
                calories: 210,
                protein_g: 5.2,
                carbs_g: 43,
                fat_g: 0.8,
                fiber_g: 2.4,
                sugar_g: 0.6,
                added_sugar_g: 0,
            }),
            ingredient(3, "Устричний соус", 20, "g", {
                calories: 70,
                protein_g: 2.8,
                carbs_g: 5,
                fat_g: 3.2,
                sugar_g: 10.7,
                added_sugar_g: 6,
            }),
        ],
    };
    const itemsByRow = (rows: Meal[]) =>
        new Map(
            rows
                .filter((m) => ITEMS[m.description])
                .map((m) => [m.id, ITEMS[m.description]!]),
        );
    // Alcohol: meal-logged has tracking off (so the wine's figure is nulled,
    // as the server does), the other two have it on.
    const dayItems = (alcoholOn: boolean) =>
        buildMealItemsMeta(dayMeals, itemsByRow(dayMeals), alcoholOn);
    const summaryItems = buildMealItemsMeta(
        summaryMealRows,
        itemsByRow(summaryMealRows),
        true,
    );
    // The key is present only when some row has items, as on the server.
    const itemsEntry = (payload: unknown) =>
        payload ? { [MEAL_ITEMS_META_KEY]: payload } : {};

    // Per-widget CallToolResult `_meta`, delivered beside structuredContent.
    const weight = weightTrendsFixture(params);
    const trends = trendsFixture(params, macroDrinkUnit);
    const METAS: Record<string, unknown> = {
        "nutrition-summary": {
            ...summaryMeta,
            [ADDED_SUGAR_META_KEY]: summaryAddedSugar,
            ...(satMode ? { [SATURATED_FAT_META_KEY]: summaryFats } : {}),
            ...itemsEntry(summaryItems),
        },
        "weight-trends": weight.meta,
        trends: trends.meta,
        // goal-progress has alcohol on and caffeine recorded, so with added
        // sugar it shows the sugars row (sugar, added sugar) above a
        // three-cell limits row (alcohol, caffeine, fiber). meal-logged has
        // alcohol off: the sugars row above caffeine and fiber. ?noMeta=1
        // drops the key and sugar goes back into the limits row.
        // With ?meals=0 its payload lists no meals, so neither does its
        // `_meta`.
        "goal-progress": staticGoalProgress
            ? {
                  [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                      goal: 25,
                      days: { "2026-07-15": dayMeals },
                      meals: [],
                  }),
              }
            : {
                  [ADDED_SUGAR_META_KEY]: dayAddedSugar,
                  ...(satMode ? { [SATURATED_FAT_META_KEY]: dayFats } : {}),
                  ...itemsEntry(dayItems(true)),
              },
        "meal-logged": {
            [ADDED_SUGAR_META_KEY]: dayAddedSugar,
            ...(satMode ? { [SATURATED_FAT_META_KEY]: dayFats } : {}),
            ...itemsEntry(dayItems(false)),
        },
    };

    // ?addedSugar=unrecorded|zero: the added-sugar edge cases, against a
    // 29 g limit. Built with the server's own buildAddedSugarMeta, from Meal
    // rows shaped like the breakdown rows they are joined to.
    const asMode = params.get("addedSugar");
    const asEdge = asMode === "unrecorded" || asMode === "zero";
    const edgeRows =
        asMode === "zero"
            ? [
                  {
                      description: "Apple",
                      meal_type: "snack",
                      date: null,
                      calories: 95,
                      protein_g: 0.5,
                      carbs_g: 25,
                      fat_g: 0.3,
                      fiber_g: 4.4,
                      sugar_g: 19,
                      alcohol_g: null,
                      caffeine_mg: null,
                  },
                  {
                      description: "Diet cola 330 ml",
                      meal_type: "snack",
                      date: null,
                      calories: 2,
                      protein_g: 0,
                      carbs_g: 0,
                      fat_g: 0,
                      fiber_g: 0,
                      sugar_g: 0,
                      alcohol_g: null,
                      caffeine_mg: 42,
                  },
              ]
            : [
                  {
                      description: "Cola 330 ml",
                      meal_type: "snack",
                      date: null,
                      calories: 139,
                      protein_g: 0,
                      carbs_g: 35,
                      fat_g: 0,
                      fiber_g: 0,
                      sugar_g: 35,
                      alcohol_g: null,
                      caffeine_mg: 32,
                  },
              ];
    const edgeMeals = edgeRows.map((r, i) => ({
        ...asMeal(r, i),
        // asMeal fills added sugar from ADDED; here it is the case itself.
        added_sugar_g: asMode === "zero" ? 0 : null,
    }));
    const sumOf = (k: keyof (typeof edgeRows)[number]) =>
        edgeRows.reduce((a, r) => a + ((r[k] as number | null) ?? 0), 0);
    const edgeTotals = {
        calories: sumOf("calories"),
        protein_g: sumOf("protein_g"),
        carbs_g: sumOf("carbs_g"),
        fat_g: sumOf("fat_g"),
        fiber_g: sumOf("fiber_g"),
        sugar_g: sumOf("sugar_g"),
        alcohol_g: null,
        caffeine_mg: sumOf("caffeine_mg"),
        water_ml: 0,
    };
    // A total-sugar limit is not set: the case seen in production, where the
    // 29 g limit was on added sugar only.
    const edgeGoals = { ...goals, sugar_g: null, alcohol_g: null };
    const edgeDayMeta = (rows: Meal[]) =>
        buildAddedSugarMeta({
            goal: 29,
            days: { "2026-07-15": edgeMeals },
            meals: rows,
        });
    // Every day of a window carries the edge value, the limit is 29 g.
    const edgeWindowMeta = (meta: unknown) => {
        const m = meta as { days?: Record<string, number | null> };
        return {
            v: 1,
            goal: 29,
            days: Object.fromEntries(
                Object.keys(m.days ?? {}).map((d) => [
                    d,
                    asMode === "zero" ? 0 : null,
                ]),
            ),
            contributors: 0,
        };
    };
    if (asEdge) {
        // meal-logged and goal-progress switch to the edge rows, which carry
        // no ingredients, so their items key goes (it is positional and would
        // no longer line up). The summary keeps its rows, so it keeps its key.
        METAS["meal-logged"] = {
            [ADDED_SUGAR_META_KEY]: edgeDayMeta(edgeMeals),
        };
        METAS["goal-progress"] = {
            [ADDED_SUGAR_META_KEY]: edgeDayMeta(
                staticGoalProgress ? [] : edgeMeals,
            ),
        };
        METAS["nutrition-summary"] = {
            ...summaryMeta,
            ...itemsEntry(summaryItems),
            [ADDED_SUGAR_META_KEY]: {
                ...edgeWindowMeta(summaryAddedSugar),
                meals: Object.fromEntries(
                    Object.keys(summaryAddedSugar.meals ?? {}).map((id) => [
                        id,
                        asMode === "zero" ? 0 : null,
                    ]),
                ),
            },
        };
        METAS.trends = {
            ...(trends.meta as Record<string, unknown>),
            [ADDED_SUGAR_META_KEY]: edgeWindowMeta(
                (trends.meta as Record<string, unknown>)[ADDED_SUGAR_META_KEY],
            ),
        };
    }

    const RESULTS: Record<string, unknown> = {
        "nutrition-summary": {
            start_date: "2026-07-09",
            end_date: "2026-07-15",
            logged_days: days.length,
            // 2026-07-09 → 2026-07-15 is 7 calendar days and all 7 are logged,
            // so this previews the no-gap caption. The gappy branch (where the
            // header reads "15 of 30 days logged") is pinned by
            // public/widgets/summary-caption.test.ts; edit both dates together
            // if you want to eyeball it here.
            days_in_range: days.length,
            drink_unit: macroDrinkUnit,
            goals,
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
            days,
            meals: summaryMeals,
        },
        "goal-progress": {
            date: "2026-07-15",
            meal_count: 4,
            water_entries: 6,
            drink_unit: macroDrinkUnit,
            goals,
            totals,
            has_goals: true,
            // The four day rows (alcohol on), two of them with ingredients.
            // ?meals=0 empties it to preview the strip's static path: with no
            // per-meal rows behind them, no tile is a button, the "tap a
            // metric" hint is absent and every cell reads as the plain figure
            // it always was.
            meals: staticGoalProgress ? [] : meals,
        },
        "meal-logged": {
            action: "logged",
            date: "2026-07-15",
            logged_meal: {
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
            },
            has_goals: true,
            // Alcohol tracking OFF for this one, so the panel must show no
            // alcohol stat line at all (null, not 0) — while the caffeine line
            // stays, which is the point: caffeine has no opt-in flag, only the
            // data-driven null.
            drink_unit: null,
            goals: { ...goals, alcohol_g: null },
            totals: { ...totals, alcohol_g: null },
            meals: mealsNoAlcohol,
        },
        trends: trends.result,
        // start_meal_import's payload. Without it the importer would fall back
        // to its built-in defaults and the alcohol gate would never be
        // exercised here — which is exactly how the leak shipped.
        "import-meals": {
            tz: "Europe/Kyiv",
            tz_configured: true,
            today: "2026-07-15",
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
        },
        "weight-trends": weight.result,
    };
    if (asEdge) {
        RESULTS["meal-logged"] = {
            action: "logged",
            date: "2026-07-15",
            logged_meal: edgeRows[edgeRows.length - 1],
            has_goals: true,
            drink_unit: null,
            goals: edgeGoals,
            totals: edgeTotals,
            meals: edgeRows,
        };
        RESULTS["goal-progress"] = {
            ...(RESULTS["goal-progress"] as Record<string, unknown>),
            meal_count: edgeRows.length,
            drink_unit: null,
            goals: edgeGoals,
            // edgeTotals has no water, so neither does the header's count.
            water_entries: 0,
            totals: edgeTotals,
            meals: staticGoalProgress ? [] : edgeRows,
        };
    }
    // ?sources=1: where each value came from. The fixture is keyed by the
    // fixture meal's description; the detail covers every record the tags name.
    // The record names are long enough to show the 60-character cap.
    if (params.get("sources") === "1" && !asEdge) {
        const SOURCE_DETAIL: SourceDetail = {
            "usda:171477": {
                name: "Chicken, broilers or fryers, breast, meat only, cooked, fried",
                data_type: "Survey (FNDDS)",
            },
            "usda:169704": {
                name: "Rice, white, long-grain, cooked",
                data_type: "SR Legacy",
            },
            "usda:171077": { name: "Chicken, broiler, breast, roasted" },
            "usda:174848": {
                name: "Beer, regular, all",
                data_type: "SR Legacy",
            },
            "openfoodfacts:4901777123456": { name: "Teriyaki sauce" },
        };
        const SOURCE_FIXTURE: Record<
            string,
            { meal: NutrientSources; items: (NutrientSources | null)[] }
        > = {
            "Grilled chicken & rice bowl": {
                meal: {
                    calories: { s: "usda", ref: "171477" },
                    protein_g: { s: "estimate" },
                    fat_g: {
                        s: "mixed",
                        parts: [
                            { s: "usda", share: 67 },
                            { s: "estimate", share: 33 },
                        ],
                    },
                    carbs_g: { s: "user" },
                    fiber_g: { s: "openfoodfacts", ref: "4901777123456" },
                    added_sugar_g: { s: "user" },
                },
                // Рис басмати, Куряче філе, Соус теріякі, Едамаме. The sauce's
                // fibre is null, so its estimate tag is never shown.
                items: [
                    {
                        calories: { s: "usda", ref: "169704" },
                        carbs_g: { s: "usda", ref: "169704" },
                    },
                    {
                        calories: { s: "usda", ref: "171077" },
                        protein_g: { s: "usda", ref: "171077" },
                    },
                    {
                        added_sugar_g: {
                            s: "openfoodfacts",
                            ref: "4901777123456",
                        },
                        fiber_g: { s: "estimate" },
                    },
                    null,
                ],
            },
            "Salmon with quinoa & veg": {
                meal: {
                    calories: { s: "estimate" },
                    protein_g: { s: "usda", ref: "171077" },
                    alcohol_g: { s: "usda", ref: "174848" },
                },
                // The red wine's alcohol is the item tag a user with tracking
                // off never sees, because the server drops alcohol then.
                items: [
                    null,
                    null,
                    { fiber_g: { s: "estimate" } },
                    {
                        alcohol_g: { s: "usda", ref: "174848" },
                        calories: { s: "usda", ref: "174848" },
                    },
                ],
            },
            "Double espresso": {
                meal: { caffeine_mg: { s: "user" } },
                items: [],
            },
        };
        const sourcesOf = (rows: Meal[], alcoholOn: boolean) => {
            const mealSources = new Map<
                string,
                { sources: NutrientSources | null; detail: SourceDetail | null }
            >();
            const items = new Map<
                string,
                {
                    nutrient_sources: NutrientSources | null;
                    source_detail: SourceDetail | null;
                }[]
            >();
            for (const m of rows) {
                const fx = SOURCE_FIXTURE[m.description];
                if (!fx) continue;
                mealSources.set(m.id, {
                    sources: fx.meal,
                    detail: SOURCE_DETAIL,
                });
                if (fx.items.length && ITEMS[m.description]) {
                    items.set(
                        m.id,
                        fx.items.map((sources) => ({
                            nutrient_sources: sources,
                            source_detail: SOURCE_DETAIL,
                        })),
                    );
                }
            }
            return buildNutrientSourcesMeta(
                rows,
                mealSources,
                items,
                alcoholOn,
            );
        };
        const withSources = (widget: string, payload: unknown) => {
            if (!payload) return;
            METAS[widget] = {
                ...(METAS[widget] as Record<string, unknown>),
                [NUTRIENT_SOURCES_META_KEY]: payload,
            };
        };
        // The summary tracks alcohol; meal-logged does not (its tracking is
        // off, so the alcohol tag is dropped, as the server drops it).
        withSources("nutrition-summary", sourcesOf(summaryMealRows, true));
        if (!staticGoalProgress) {
            withSources("goal-progress", sourcesOf(dayMeals, true));
        }
        withSources("meal-logged", sourcesOf(dayMeals, false));
    }

    // Probe and gallery paint their own UI; anything non-null will do.
    const baseResult = RESULTS[widget] ?? { probe: true };
    // ?locale= reaches every widget through the field they all read first.
    const toolResult =
        locale && typeof baseResult === "object"
            ? { ...baseResult, locale }
            : baseResult;
    const toolMeta = noMeta ? null : (METAS[widget] ?? null);

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>host: ${widget}</title>
<style>
  body{font:13px/1.5 -apple-system,system-ui,sans-serif;margin:16px${theme === "dark" ? ";background:#1c1c1e;color:#eee" : ""}}
  #frame{width:100%;height:130px;border:2px solid #888;border-radius:8px;transition:height .15s}
  #log{margin-top:12px;padding:8px;background:#111;color:#0f0;border-radius:6px;
       font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap;max-height:300px;overflow:auto}
  .cfg{color:#666}
</style></head>
<body>
  <strong>${widget}</strong>
  <span class="cfg">serverTools=${serverTools} answerTools=${answerTools} delay=${delay}ms${maxHeight ? " maxHeight=" + maxHeight : ""}${failCalls ? " fail=1" : ""}${noMeta ? " noMeta=1" : ""}${staticGoalProgress ? " meals=0" : ""} theme=${theme}${locale ? " locale=" + locale : ""} drinkUnit=${drinkUnit ?? "null (tracking off)"}</span>
  <div style="margin-top:8px"><iframe id="frame" sandbox="allow-scripts" src="/widget/${encodeURIComponent(widget)}"></iframe></div>
  <div style="margin-top:8px">
    <button onclick="hostRequest(1)">host req id=1</button>
    <button onclick="hostRequest(2)">host req id=2</button>
    <button onclick="hostNotify()">host-context-changed (dark)</button>
  </div>
  <div id="log">host ready — iframe starts at 130px and grows only on size-changed</div>
<script>
const CFG = {
  serverTools: ${serverTools},
  answerTools: ${answerTools},
  delay: ${delay},
  maxHeight: ${maxHeight ? Number(maxHeight) : "null"},
  fail: ${failCalls},
  theme: ${JSON.stringify(theme)},
  locale: ${JSON.stringify(locale)},
};
const TOOL_RESULT = ${JSON.stringify(toolResult)};
// The result's _meta (null with ?noMeta=1 or for a widget that has none). The
// spec has the host forward the whole CallToolResult, _meta included.
const TOOL_META = ${JSON.stringify(toolMeta)};
const toolResultParams = () => TOOL_META
  ? { structuredContent: TOOL_RESULT, _meta: TOOL_META }
  : { structuredContent: TOOL_RESULT };
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
function hostNotify() {
  log("-> host-context-changed theme=dark");
  send({ jsonrpc: "2.0", method: "ui/notifications/host-context-changed",
         params: { hostContext: { theme: "dark" } } });
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
    const hostContext = { theme: CFG.theme };
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
    log("<- initialized; delivering tool-result");
    send({ jsonrpc: "2.0", method: "ui/notifications/tool-result",
           params: toolResultParams() });
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
        ...toolResultParams(),
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
