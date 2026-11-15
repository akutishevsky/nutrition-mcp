// Synthetic data for the dashboard's dev preview (scripts/dashboard-preview.ts).
//
// Pure and deterministic: a seeded PRNG generates every row relative to the
// `today` it is given, so the same day always renders the same page and no
// Supabase call is ever made. It lives in src/ rather than scripts/ so it is
// typechecked and the drift guard in src/mcp.test.ts can import it.
//
// The rows go through buildDashboardPayload — the exact function production
// runs after its fetch — so the preview cannot show a shape the real API does
// not produce.

import {
    bodyOf,
    buildDashboardPayload,
    dashboardWindow,
    type DashboardInputs,
} from "./dashboard.js";
import {
    bmrFor,
    dailyBurn,
    KCAL_PER_GRAM,
    TEF_FRACTION,
    foodTef,
    type BodyDetails,
} from "./body.js";
import {
    dateInTz,
    shiftLocalDate,
    todayInTz,
    zonedWallClockToUtc,
} from "./tz.js";
import type {
    ActivityDay,
    Meal,
    NutritionGoals,
    Profile,
    WaterEntry,
    WeightEntry,
} from "./supabase.js";

export const SCENARIOS = [
    "full",
    "over-goal",
    "no-body",
    "no-goals",
    "empty",
    "lb",
    "calibrate",
    "offset",
] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export function isScenario(s: string): s is ScenarioName {
    return (SCENARIOS as readonly string[]).includes(s);
}

/** Every row a scenario has, before any window filter. */
export interface FixtureData {
    profile: Profile;
    meals: Meal[];
    water: WaterEntry[];
    weight: WeightEntry[];
    goals: NutritionGoals | null;
    activity: ActivityDay[];
}

const USER = "preview-user";
const STAMP = "2026-01-01T00:00:00.000Z";

export function scenarioTz(name: ScenarioName): string {
    return name === "lb" ? "Asia/Tokyo" : "America/New_York";
}

/** mulberry32: tiny, fast, good enough for fake meals. */
function prng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function instant(date: string, hh: number, mi: number, tz: string): string {
    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    return zonedWallClockToUtc(y, m, d, hh, mi, 0, tz).instant.toISOString();
}

const DISHES: Record<string, string[]> = {
    breakfast: [
        "Oats with berries and whey",
        "Greek yogurt, granola, banana",
        "Two eggs, sourdough toast, avocado",
        "Protein pancakes with maple syrup",
        "Cottage cheese, pineapple, almonds",
    ],
    lunch: [
        "Chicken bowl, rice, black beans, salsa",
        "Turkey and swiss on rye, apple",
        "Salmon poke bowl with edamame",
        "Lentil soup and a whole-wheat roll",
        "Burrito bowl with steak, fajita veg & guac",
    ],
    dinner: [
        "Grilled chicken thighs, roast potatoes, broccoli",
        "Spaghetti bolognese with parmesan",
        "Tofu stir-fry with jasmine rice",
        "Cod, quinoa, green beans, lemon butter",
        "Beef chilli with sour cream & cheddar",
    ],
    snack: [
        "Protein bar",
        "Apple and peanut butter",
        "Dark chocolate, 2 squares",
        "Skyr with honey",
        "Handful of mixed nuts",
    ],
    treat: [
        "Pizza night — 3 slices pepperoni",
        "Birthday cake and prosecco",
        "Two IPAs and nachos at the bar",
        "Tiramisu after dinner out",
        "Party snacks: chips, dip, mini sausage rolls",
    ],
};

/** A stable, uuid-shaped id from a readable one (FNV-1a, four seeds). The
 *  edit endpoint 404s anything that is not a uuid, as production must, so
 *  fixture meals need real-looking ids to be editable in the preview. */
export function uuidOf(s: string): string {
    let h = "";
    for (let k = 0; k < 4; k++) {
        let x = 0x811c9dc5 ^ k;
        for (let i = 0; i < s.length; i++) {
            x ^= s.charCodeAt(i);
            x = Math.imul(x, 0x01000193);
        }
        h += (x >>> 0).toString(16).padStart(8, "0");
    }
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function makeMeal(
    id: string,
    date: string,
    hh: number,
    mi: number,
    type: string,
    kcal: number,
    rnd: () => number,
    tz: string,
): Meal {
    const list = DISHES[type]!;
    const pShare = 0.24 + rnd() * 0.12;
    const fShare = 0.25 + rnd() * 0.1;
    const cShare = 1 - pShare - fShare;
    const at = instant(date, hh, mi, tz);
    return {
        id: uuidOf(id),
        user_id: USER,
        logged_at: at,
        meal_type: type,
        description: list[Math.floor(rnd() * list.length)]!,
        calories: Math.round(kcal),
        protein_g: Math.round((kcal * pShare) / 4),
        carbs_g: Math.round((kcal * cShare) / 4),
        fat_g: Math.round((kcal * fShare) / 9),
        fiber_g: Math.round(2 + rnd() * 9),
        sugar_g: Math.round(2 + rnd() * 16),
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
    };
}

const SLOTS: Array<[string, number, number, number]> = [
    // type, hour, minute, share of the day
    ["breakfast", 8, 10, 0.25],
    ["lunch", 12, 40, 0.35],
    ["dinner", 19, 5, 0.32],
    ["snack", 15, 30, 0.08],
];

/** A day's meals summing to `total` kcal, 2–4 of them. */
function dayMeals(
    date: string,
    total: number,
    count: number,
    rnd: () => number,
    tz: string,
    idBase: string,
): Meal[] {
    const slots =
        count === 2
            ? [SLOTS[0]!, SLOTS[1]!]
            : count === 3
              ? [SLOTS[0]!, SLOTS[1]!, SLOTS[2]!]
              : SLOTS;
    const shareSum = slots.reduce((a, s) => a + s[3], 0);
    return slots.map(([type, hh, mi, share], k) =>
        makeMeal(
            `${idBase}-${k}`,
            date,
            hh,
            mi + Math.floor(rnd() * 15),
            type,
            (total * share) / shareSum,
            rnd,
            tz,
        ),
    );
}

const FULL_GOALS: NutritionGoals = {
    user_id: USER,
    daily_calories: 1800,
    daily_protein_g: 140,
    daily_carbs_g: 180,
    daily_fat_g: 60,
    daily_fiber_g: 30,
    daily_sugar_g: 50,
    daily_alcohol_g: null,
    daily_caffeine_mg: null,
    daily_water_ml: 2500,
    target_weight_g: 78_000,
    calorie_goal_mode: null,
    weight_rate_g_per_day: null,
    target_date: null,
    updated_at: STAMP,
};

const BODY: BodyDetails = {
    height_cm: 178,
    birth_date: "1990-05-14",
    sex: "male",
};

function profileFor(name: ScenarioName): Profile {
    const withBody = name !== "no-body" && name !== "empty";
    return {
        user_id: USER,
        timezone: scenarioTz(name),
        preferred_weight_unit: name === "lb" ? "lb" : "kg",
        widgets_enabled: true,
        alcohol_tracking_enabled: false,
        preferred_drink_unit: null,
        locale: null,
        energy_kcal_per_gram: null,
        trend_window_days: null,
        height_cm: withBody ? BODY.height_cm : null,
        birth_date: withBody ? BODY.birth_date : null,
        sex: withBody ? BODY.sex : null,
        created_at: STAMP,
        updated_at: STAMP,
    };
}

function weightRow(
    id: string,
    date: string,
    g: number,
    tz: string,
    stepG = 100,
): WeightEntry {
    const at = instant(date, 7, 30, tz);
    return {
        id,
        user_id: USER,
        weight_g: Math.round(g / stepG) * stepG,
        logged_at: at,
        notes: null,
        created_at: at,
        idempotency_key: null,
    };
}

// Generating a scenario formats ~1,000 timestamps through Intl; a test file
// asks for the same (scenario, day) dozens of times. Cached per pair, small.
const scenarioCache = new Map<string, FixtureData>();
const SCENARIO_CACHE_MAX = 32;

/**
 * All of a scenario's rows, generated backwards from `today` (the local date
 * in the scenario's timezone). Returns a shallow copy of a cached build, so a
 * caller may reassign its fields (scenarioWithEdits does) without touching
 * the cache; the arrays themselves must not be mutated in place.
 */
export function buildScenario(name: ScenarioName, today: string): FixtureData {
    const key = `${name}|${today}`;
    let fx = scenarioCache.get(key);
    if (!fx) {
        fx = generateScenario(name, today);
        if (scenarioCache.size >= SCENARIO_CACHE_MAX) scenarioCache.clear();
        scenarioCache.set(key, fx);
    }
    return { ...fx };
}

function generateScenario(name: ScenarioName, today: string): FixtureData {
    const tz = scenarioTz(name);
    const profile = profileFor(name);
    if (name === "empty")
        return {
            profile,
            meals: [],
            water: [],
            weight: [],
            goals: null,
            activity: [],
        };
    if (name === "calibrate") return calibrateScenario(profile, today, tz);
    // Same 45 days of data, resting burn left on the plain formula: the
    // Estimate-vs-reality card shows the full ~150 kcal/day gap.
    if (name === "offset")
        return {
            ...calibrateScenario(profile, today, tz),
            profile: { ...profile, resting_basis: "formula" },
        };

    const rnd = prng(0xc0ffee);
    const span = 120;
    const goals = name === "no-goals" ? null : FULL_GOALS;
    const meals: Meal[] = [];
    const water: WaterEntry[] = [];
    const weight: WeightEntry[] = [];
    const activity: ActivityDay[] = [];

    let nextWeigh = 0;
    for (let k = span - 1; k >= 0; k--) {
        const date = shiftLocalDate(today, -k);
        const isToday = k === 0;

        const active = rnd() < 0.82 ? Math.round(rnd() * 600) : null;
        if (active != null)
            activity.push({
                user_id: USER,
                date,
                active_kcal: active,
                source: "garmin",
                updated_at: STAMP,
            });
        const goal = 1800 + (active ?? 0);

        // Weigh-ins every 1–4 days, −0.15 kg/week from 84 kg, ±0.3 kg noise.
        if (nextWeigh <= 0 || isToday) {
            const trend = 84_000 - ((span - 1 - k) * 150) / 7;
            weight.push(
                weightRow(`w-${date}`, date, trend + (rnd() - 0.5) * 600, tz),
            );
            nextWeigh = 1 + Math.floor(rnd() * 4);
        }
        nextWeigh -= 1;

        if (isToday) {
            // Two meals so far today: breakfast and lunch.
            const total = name === "over-goal" ? goal + 300 : 1240;
            const b = Math.round(total * 0.34);
            meals.push(
                makeMeal(`m-${date}-0`, date, 8, 10, "breakfast", b, rnd, tz),
                makeMeal(
                    `m-${date}-1`,
                    date,
                    12,
                    40,
                    "lunch",
                    total - b,
                    rnd,
                    tz,
                ),
            );
        } else {
            // ~10% unlogged days — never inside over-goal's forced week, so
            // its "5 of the last 7 over" does not depend on the PRNG stream.
            const forcedWeek = name === "over-goal" && k <= 6;
            if (rnd() < 0.1 && !forcedWeek) continue;
            // over-goal: 4 of the 6 days before today are over (5 of 7 with
            // today). Elsewhere ~20% of days run over.
            const roll = rnd();
            const over =
                name === "over-goal" && k <= 6
                    ? k !== 3 && k !== 5
                    : roll < 0.2;
            const total = over
                ? goal + 80 + rnd() * 420
                : goal - 60 - rnd() * 480;
            const count = 2 + Math.floor(rnd() * 3);
            // About one evening in eight is a treat (pizza, party, drinks
            // out) — on its own row, as the user logs it. Kept out of the
            // last week so over-goal's "5 of the last 7" stays exact.
            const treat = k > 7 && rnd() < 0.12 ? 350 + rnd() * 450 : 0;
            meals.push(
                ...dayMeals(date, total - treat, count, rnd, tz, `m-${date}`),
            );
            if (treat)
                meals.push(
                    makeMeal(
                        `t-${date}`,
                        date,
                        21,
                        15,
                        "treat",
                        treat,
                        rnd,
                        tz,
                    ),
                );
        }

        // Water: two to four drinks a day.
        const drinks = isToday ? 2 : 2 + Math.floor(rnd() * 3);
        for (let j = 0; j < drinks; j++)
            water.push({
                id: `h2o-${date}-${j}`,
                user_id: USER,
                amount_ml: 250 + Math.round(rnd() * 3) * 250,
                logged_at: instant(date, 9 + j * 3, 0, tz),
                notes: null,
                created_at: STAMP,
                idempotency_key: null,
            });
    }

    return { profile, meals, water, weight, goals, activity };
}

/**
 * 90 days, enough for a 30-day chart whose every day is calibrated from the
 * 42 before it. The scale is driven by the SAME burn model the dashboard uses
 * (BMR + active + TEF), minus 150 kcal/day: so the real baseline is 150 below
 * the formula, and the calibration should find an offset of about +150.
 *
 * Realistic mess, so the page shows what each rule does:
 *  - ~4% of days unlogged (the body still changes);
 *  - ~6% "incomplete" days: a full day eaten but only breakfast logged, so
 *    the automatic rule (2+ entries, half a typical day) leaves them out;
 *  - ~3% of days the watch did not sync (no activity row): never counted;
 *  - weigh-ins every 3 days with ±250 g of water noise around the true
 *    weight — the least-squares trend sees through it, endpoints would not.
 */
const CALIBRATE_OFFSET_KCAL = 150;
function calibrateScenario(
    profile: Profile,
    today: string,
    tz: string,
): FixtureData {
    profile = { ...profile, resting_basis: "calibrated" };
    const rnd = prng(0xca11b);
    const span = 90;
    const body = bodyOf(profile);
    const meals: Meal[] = [];
    const weight: WeightEntry[] = [];
    const activity: ActivityDay[] = [];

    let w = 84_000;
    for (let k = span - 1; k >= 0; k--) {
        const date = shiftLocalDate(today, -k);
        const active = Math.round(150 + rnd() * 350);
        if (rnd() >= 0.03)
            activity.push({
                user_id: USER,
                date,
                active_kcal: active,
                source: "garmin",
                updated_at: STAMP,
            });
        // Weigh in every 3 days (that morning precedes the day's eating),
        // with water noise on top of the true weight.
        if ((span - 1 - k) % 3 === 0)
            weight.push(
                weightRow(`w-${date}`, date, w + (rnd() - 0.5) * 500, tz, 10),
            );
        if (k === 0) {
            meals.push(
                makeMeal(`m-${date}-0`, date, 8, 10, "breakfast", 450, rnd, tz),
            );
            break;
        }
        const bmr = bmrFor(body, Math.round(w / 100) * 100, date)!;
        // Eat ~400-650 kcal under the formula's break-even intake.
        const eaten = (bmr + active) / (1 - TEF_FRACTION) - 400 - rnd() * 250;
        const roll = rnd();
        // What was really eaten (logged or not): its macros set digestion.
        const all = dayMeals(date, eaten, 3, rnd, tz, `m-${date}`);
        const sum = (key: "calories" | "protein_g" | "carbs_g" | "fat_g") =>
            all.reduce((t, m) => t + (m[key] ?? 0), 0);
        const tef = foodTef({
            calories: sum("calories"),
            protein_g: sum("protein_g"),
            carbs_g: sum("carbs_g"),
            fat_g: sum("fat_g"),
        });
        // ~4% unlogged; ~6% incomplete: only breakfast got logged.
        if (roll >= 0.04) meals.push(...(roll < 0.1 ? all.slice(0, 1) : all));
        const trueBurn = dailyBurn(bmr, active, tef) - CALIBRATE_OFFSET_KCAL;
        w += (sum("calories") - trueBurn) / KCAL_PER_GRAM;
    }
    return {
        profile,
        meals,
        water: [],
        weight,
        goals: FULL_GOALS,
        activity,
    };
}

/**
 * The rows production would have fetched for this window: meals, water and
 * activity in [fetchStart, endDate], weigh-ins in [weightStart, endDate] (all
 * local dates in `tz`), and the newest weigh-in overall — exactly what the
 * Supabase range queries return. Without it a 120-day fixture would leak
 * weeks-old meals into days=7.
 */
export function previewInputs(
    fx: FixtureData,
    days: number,
    today: string,
): DashboardInputs {
    const tz = fx.profile.timezone ?? "UTC";
    const { endDate, weightFetchStart, fetchStart } = dashboardWindow(
        today,
        days,
    );
    const inRange = (iso: string, from: string) => {
        const d = dateInTz(iso, tz);
        return d >= from && d <= endDate;
    };
    const sortedWeight = fx.weight
        .slice()
        .sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    return {
        profile: fx.profile,
        meals: fx.meals.filter((m) => inRange(m.logged_at, fetchStart)),
        water: fx.water.filter((w) => inRange(w.logged_at, fetchStart)),
        weight: sortedWeight.filter((w) =>
            inRange(w.logged_at, weightFetchStart),
        ),
        goals: fx.goals,
        latestWeight: sortedWeight.at(-1) ?? null,
        activityRows: fx.activity.filter(
            (a) => a.date >= fetchStart && a.date <= endDate,
        ),
        days,
        today,
    };
}

/** What the dev preview has "written" this session, held in its memory. */
export interface PreviewEdits {
    body?: BodyDetails;
    restingBasis?: "formula" | "calibrated";
    /** Calibration day choices: true = count, false = exclude. */
    dayOverrides?: Record<string, boolean>;
    /** Weigh-ins logged from the page's form. */
    weights?: WeightEntry[];
    /** Weigh-in edits from the Weigh-ins tab, by entry id. */
    weightPatches?: Record<string, Partial<WeightEntry>>;
    /** Weigh-in ids deleted from the page. */
    deletedWeightIds?: string[];
    /** Meal edits from the Meals tab, by meal id. */
    mealPatches?: Record<string, Partial<Meal>>;
    /** Meals logged from the page (form or one-tap repeat). */
    addedMeals?: Meal[];
    /** Meal ids deleted from the page ("Undo"). */
    deletedMealIds?: string[];
    /** Calorie goal saved from the page: a number, or null for "use the
     *  estimated burn". Absent means not edited this session. */
    goalCalories?: number | null;
}

function emptyGoals(): NutritionGoals {
    return {
        user_id: "fixture",
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_alcohol_g: null,
        daily_caffeine_mg: null,
        daily_water_ml: null,
        target_weight_g: null,
        calorie_goal_mode: null,
        weight_rate_g_per_day: null,
        target_date: null,
        updated_at: "",
    };
}

/** A scenario's rows with the preview's in-memory writes applied. */
export function scenarioWithEdits(
    name: ScenarioName,
    today: string,
    edits: PreviewEdits = {},
): FixtureData {
    const fx = buildScenario(name, today);
    if (edits.body) fx.profile = { ...fx.profile, ...edits.body };
    if (edits.restingBasis)
        fx.profile = { ...fx.profile, resting_basis: edits.restingBasis };
    {
        const wPatch = edits.weightPatches ?? {};
        const wGone = new Set(edits.deletedWeightIds ?? []);
        fx.weight = [...fx.weight, ...(edits.weights ?? [])]
            .filter((w) => !wGone.has(w.id))
            .map((w) => (wPatch[w.id] ? { ...w, ...wPatch[w.id] } : w));
    }
    if (edits.goalCalories !== undefined)
        fx.goals = {
            ...(fx.goals ?? emptyGoals()),
            daily_calories: edits.goalCalories,
        };
    const patches = edits.mealPatches ?? {};
    const gone = new Set(edits.deletedMealIds ?? []);
    fx.meals = [...fx.meals, ...(edits.addedMeals ?? [])]
        .filter((m) => !gone.has(m.id))
        .map((m) => (patches[m.id] ? { ...m, ...patches[m.id] } : m));
    return fx;
}

/** The rows production would fetch for a scenario, with the preview's
 *  in-memory writes applied. */
export function previewInputsFor(
    name: ScenarioName,
    days: number,
    edits: PreviewEdits = {},
): DashboardInputs {
    const tz = scenarioTz(name);
    const today = todayInTz(tz);
    const fx = scenarioWithEdits(name, today, edits);
    return {
        ...previewInputs(fx, days, today),
        dayOverrides: edits.dayOverrides,
    };
}

/** The /api/dashboard/data JSON the preview serves for a scenario. */
export function previewPayload(
    name: ScenarioName,
    days: number,
    edits: PreviewEdits = {},
) {
    return buildDashboardPayload(previewInputsFor(name, days, edits));
}
