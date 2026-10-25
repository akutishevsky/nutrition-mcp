// Design scenarios for the meal-logged and nutrition-summary widgets in the
// local host harness (scripts/widget-harness.ts, `?scenario=`). The fixtures
// are the redesign artboards' own (MG1/MG2 and W1): the same meals,
// ingredients and day totals, turned into Meal rows and run through the
// server's real `_meta` builders, so the widget sees exactly what a tool
// result would carry. Dev-only, like the harness.

import { buildAddedSugarMeta, addedSugarExtra } from "../src/added-sugar.js";
import { buildMealItemsMeta, type MealItemValues } from "../src/meal-items.js";
import { buildMealTimesMeta } from "../src/meal-times.js";
import {
    buildNutrientSourcesMeta,
    type NutrientSources,
} from "../src/provenance.js";
import {
    buildSaturatedFatMeta,
    saturatedFatExtra,
    transFatExtra,
} from "../src/saturated-fat.js";
import { buildSodiumMeta, sodiumExtra } from "../src/sodium.js";
import type { Meal } from "../src/supabase.js";
import {
    ADDED_SUGAR_META_KEY,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_ITEMS_META_KEY,
    MEAL_TIMES_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
} from "../src/widgets.js";

const TZ = "Europe/Kyiv";
const TODAY = "2026-10-24";

type Src = "usda" | "label" | "est" | "own";
/** [name, amount, unit, source, kcal, protein, carbs, fat, sodium mg] */
type ItemFx = [
    string,
    number,
    string,
    Src,
    number,
    number,
    number,
    number,
    number?,
];
/** Meal-level extras; null = not recorded. Spread over the items by kcal. */
interface Extras {
    fib?: number | null;
    sug?: number | null;
    add?: number | null;
    sat?: number | null;
    tr?: number | null;
    caf?: number | null;
    alc?: number | null;
    na?: number | null;
}
interface MealFx {
    type: string | null;
    name: string;
    items?: ItemFx[];
    /** Totals for a meal logged without ingredients: kcal, p, c, f. */
    tot?: [number, number, number, number];
    n: Extras;
}

const OATS: MealFx = {
    type: "breakfast",
    name: "Overnight oats with berries",
    items: [
        ["Rolled oats", 60, "g", "usda", 228, 8, 40, 4, 5],
        ["Milk 2%", 150, "ml", "label", 75, 5, 7, 3, 65],
        ["Blueberries", 80, "g", "usda", 46, 1, 11, 0, 1],
        ["Chia seeds", 15, "g", "est", 71, 4, 4, 5, 2],
    ],
    n: { fib: 9.4, sug: 18.2, add: 2.0, sat: 2.1, tr: 0 },
};
const YOG: MealFx = {
    type: "snack",
    name: "Greek yogurt & almonds",
    items: [
        ["Greek yogurt 2%", 170, "g", "label", 125, 18, 5, 3, 60],
        ["Almonds", 20, "g", "usda", 116, 4, 4, 11, 1],
        ["Honey", 6, "g", "est", 19, 0, 5, 0, 1],
    ],
    n: { fib: 2.4, sug: 9.1, add: 5.0, sat: 2.6, tr: 0.1 },
};
const SAND: MealFx = {
    type: "lunch",
    name: "Turkey sandwich",
    items: [
        ["Whole-wheat bread, 2 slices", 70, "g", "own", 170, 9, 56, 2, 360],
        ["Turkey breast", 90, "g", "label", 90, 26, 1, 1, 500],
        ["Lettuce & tomato", 50, "g", "est", 10, 1, 2, 0, 5],
        ["Mustard", 10, "g", "est", 10, 0, 2, 1, 110],
    ],
    n: { fib: 7.0, sug: 6.2, add: 1.5, sat: 0.9, tr: 0 },
};
const FLAT: MealFx = {
    type: "snack",
    name: "Flat white",
    items: [
        ["Whole milk", 160, "ml", "label", 118, 7, 10, 6, 70],
        ["Espresso, double", 60, "ml", "usda", 2, 0, 0, 0, 5],
    ],
    n: { fib: 0, sug: 10.1, add: 0, sat: 3.8, tr: 0.2, caf: 128 },
};
const SALAD: MealFx = {
    type: "dinner",
    name: "Grilled chicken salad",
    items: [
        ["Chicken breast, grilled", 110, "g", "usda", 182, 34, 0, 4, 85],
        ["Croutons", 29, "g", "label", 118, 2, 20, 2, 270],
        ["Olive oil vinaigrette", 15, "ml", "est", 116, 0, 2, 10, 180],
        ["Feta", 30, "g", "usda", 79, 4, 1, 6, 320],
        ["Mixed greens", 80, "g", "usda", 14, 1, 3, 0, 30],
        ["Cherry tomatoes", 60, "g", "usda", 11, 1, 2, 0, 3],
    ],
    n: { fib: 3.5, sug: 5.0, add: 0.8, sat: 5.1, tr: 0.1 },
};
const PIZZA: MealFx = {
    type: "dinner",
    name: "Margherita pizza, 3 slices",
    items: [
        ["Pizza dough", 240, "g", "est", 620, 18, 110, 8, 1150],
        ["Mozzarella", 90, "g", "usda", 254, 20, 2, 18, 560],
        ["Olive oil", 8, "ml", "est", 72, 0, 0, 8, 0],
        ["Tomato sauce", 60, "g", "est", 30, 1, 5, 1, 250],
    ],
    n: { fib: 4.3, sug: 8.4, add: 3.0, sat: 12.0, tr: 0.3 },
};
const IPA: MealFx = {
    type: "snack",
    name: "Craft IPA, 2 pints",
    items: [["IPA 6.5%", 946, "ml", "label", 420, 4, 32, 0, 28]],
    n: { fib: 0, sug: 0, add: 0, sat: 0, tr: 0, alc: 48.6 },
};
const COFFEE: MealFx = {
    type: "snack",
    name: "Black coffee",
    items: [["Black coffee, brewed", 250, "ml", "usda", 5, 0.3, 0, 0, 5]],
    n: { fib: 0, sug: 0, add: 0, sat: 0, tr: 0, caf: 95 },
};
const LONG1: MealFx = {
    type: "snack",
    name: "Drip coffee, 150 ml, Philips HD5120, batch 8 — Ethiopia Yirgacheffe washed, light roast",
    items: [
        [
            "Drip coffee, brewed (Philips HD5120, 9 g beans to 150 ml water)",
            150,
            "ml",
            "est",
            2,
            0,
            0,
            0,
            5,
        ],
    ],
    n: { fib: 0, sug: 0, add: 0, sat: 0, tr: 0, caf: 124 },
};
const LONG2: MealFx = {
    type: "dinner",
    name: "Fusilli with Globyno “Nyamski” sausages: boiled pasta, three sausages, mild Torchyn ketchup and grated hard cheese",
    items: [
        [
            "Fusilli pasta, boiled (Barilla n.98, cooked weight about 2.5× dry)",
            200,
            "g",
            "label",
            314,
            11,
            62,
            2,
            240,
        ],
        [
            "Pork sausages “Nyamski”, Globyno",
            150,
            "g",
            "label",
            405,
            18,
            3,
            36,
            1280,
        ],
        ["Ketchup “Lagidnyi”, Torchyn", 30, "g", "label", 30, 0, 7, 0, 270],
        [
            "Hard cheese, grated (type not specified)",
            15,
            "g",
            "est",
            60,
            4,
            0,
            5,
            105,
        ],
    ],
    n: { fib: 4.1, sug: 9.0, add: 6.5, sat: 16.2, tr: 0.4 },
};
const SNACK = (name: string, kcal: number, c: number, na: number): MealFx => ({
    type: "snack",
    name,
    items: [[name, 100, "g", "usda", kcal, 1, c, 0, na]],
    n: { fib: 1, sug: c * 0.6, add: 0, sat: 0.2, tr: 0 },
});
const LEFTOVERS: MealFx = {
    type: null,
    name: "Leftovers",
    tot: [640, 30, 60, 28],
    n: { fib: 5, sug: 8, add: null, sat: null, tr: null, na: null },
};
const CANTEEN: MealFx = {
    type: null,
    name: "Something from the canteen",
    tot: [450, 20, 50, 18],
    n: { fib: 3, sug: 6, add: null, sat: null, tr: null, na: 1120 },
};

const SOURCE_TAG: Record<Src, NutrientSources[keyof NutrientSources]> = {
    usda: { s: "usda", ref: "171477" },
    label: { s: "openfoodfacts", ref: "4820000000017" },
    own: { s: "user" },
    est: { s: "estimate" },
};

const round1 = (x: number) => Math.round(x * 10) / 10;

interface Built {
    meals: Meal[];
    items: Map<string, MealItemValues[]>;
}

/** Meals at the given local times on `date`, with ingredients whose extras
 *  are the meal's spread by kcal (so every total is the sum of its items). */
function build(
    date: string,
    list: [MealFx, string][],
    opts: { alcohol?: boolean; idBase?: number } = {},
): Built {
    const items = new Map<string, MealItemValues[]>();
    const meals = list.map(([fx, time], i): Meal => {
        const id = `00000000-0000-4000-8000-${String((opts.idBase ?? 0) + i + 1).padStart(12, "0")}`;
        const ex = fx.n;
        const alc = opts.alcohol === false ? null : (ex.alc ?? 0);
        let row: Partial<Meal>;
        if (fx.items) {
            const kc = fx.items.reduce((s, it) => s + it[4], 0) || 1;
            const share = (v: number | null | undefined, it: ItemFx) =>
                v == null ? null : round1((v * it[4]) / kc);
            const list = fx.items.map((it, p): MealItemValues => ({
                position: p + 1,
                name: it[0],
                amount: it[1],
                unit: it[2],
                calories: it[4],
                protein_g: it[5],
                carbs_g: it[6],
                fat_g: it[7],
                fiber_g: share(ex.fib, it),
                sugar_g: share(ex.sug, it),
                added_sugar_g: share(ex.add, it),
                saturated_fat_g: share(ex.sat, it),
                trans_fat_g: share(ex.tr, it),
                alcohol_g: alc == null ? null : share(alc, it),
                caffeine_mg: ex.caf == null ? null : share(ex.caf, it),
                sodium_mg: it[8] ?? null,
                nutrient_sources: Object.fromEntries(
                    [
                        "calories",
                        "protein_g",
                        "carbs_g",
                        "fat_g",
                        "sodium_mg",
                    ].map((k) => [k, SOURCE_TAG[it[3]]]),
                ) as NutrientSources,
            }));
            items.set(id, list);
            const sum = (k: keyof MealItemValues) =>
                list.some((x) => x[k] == null)
                    ? null
                    : round1(list.reduce((s, x) => s + Number(x[k]), 0));
            row = {
                calories: sum("calories"),
                protein_g: sum("protein_g"),
                carbs_g: sum("carbs_g"),
                fat_g: sum("fat_g"),
                fiber_g: sum("fiber_g"),
                sugar_g: sum("sugar_g"),
                added_sugar_g: sum("added_sugar_g"),
                saturated_fat_g: sum("saturated_fat_g"),
                trans_fat_g: sum("trans_fat_g"),
                alcohol_g: alc == null ? null : sum("alcohol_g"),
                caffeine_mg: ex.caf == null ? null : sum("caffeine_mg"),
                sodium_mg: sum("sodium_mg"),
            };
        } else {
            const [k, p, c, f] = fx.tot!;
            row = {
                calories: k,
                protein_g: p,
                carbs_g: c,
                fat_g: f,
                fiber_g: ex.fib ?? null,
                sugar_g: ex.sug ?? null,
                added_sugar_g: ex.add ?? null,
                saturated_fat_g: ex.sat ?? null,
                trans_fat_g: ex.tr ?? null,
                alcohol_g: alc,
                caffeine_mg: ex.caf ?? null,
                sodium_mg: ex.na ?? null,
            };
        }
        return {
            id,
            user_id: "harness",
            saved_meal_id: null,
            logged_at: `${date}T${time}:00+03:00`,
            meal_type: fx.type,
            description: fx.name,
            notes: null,
            idempotency_key: null,
            ...row,
        } as Meal;
    });
    return { meals, items };
}

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
const LIMITS = { added_sugar_g: 25, saturated_fat_g: 20, sodium_mg: 2300 };

/** MEAL_BREAKDOWN_ITEM, as mealBreakdown in src/mcp.ts builds it. */
function breakdown(meals: Meal[], withDate: boolean, alcohol: boolean) {
    return meals.map((m) => ({
        description: m.description,
        meal_type: m.meal_type ?? null,
        date: withDate ? m.logged_at.slice(0, 10) : null,
        calories: Math.round(m.calories ?? 0),
        protein_g: round1(m.protein_g ?? 0),
        carbs_g: round1(m.carbs_g ?? 0),
        fat_g: round1(m.fat_g ?? 0),
        fiber_g: round1(m.fiber_g ?? 0),
        sugar_g: round1(m.sugar_g ?? 0),
        alcohol_g: alcohol ? round1(m.alcohol_g ?? 0) : null,
        caffeine_mg: m.caffeine_mg == null ? null : round1(m.caffeine_mg),
    }));
}

function totalsOf(meals: Meal[], water: number, alcohol: boolean) {
    const s = (k: keyof Meal) =>
        round1(meals.reduce((a, m) => a + (Number(m[k]) || 0), 0));
    const any = (k: keyof Meal) => meals.some((m) => m[k] != null);
    return {
        calories: Math.round(s("calories")),
        protein_g: s("protein_g"),
        carbs_g: s("carbs_g"),
        fat_g: s("fat_g"),
        fiber_g: s("fiber_g"),
        sugar_g: s("sugar_g"),
        alcohol_g: alcohol ? s("alcohol_g") : null,
        caffeine_mg: any("caffeine_mg") ? s("caffeine_mg") : null,
        water_ml: water,
    };
}

function itemsAndSources(
    rows: Meal[],
    items: Map<string, MealItemValues[]>,
    alcohol: boolean,
) {
    const im = buildMealItemsMeta(rows, items, alcohol);
    const src = buildNutrientSourcesMeta(
        rows,
        new Map(),
        new Map(
            [...items].map(([id, list]) => [
                id,
                list.map((i) => ({
                    nutrient_sources: i.nutrient_sources ?? null,
                })),
            ]),
        ),
        alcohol,
    );
    return {
        ...(im ? { [MEAL_ITEMS_META_KEY]: im } : {}),
        ...(src ? { [NUTRIENT_SOURCES_META_KEY]: src } : {}),
    };
}

// ---------------------------------------------------------------- meal-logged

const ML_SCENARIOS: Record<
    string,
    {
        list: [MealFx, string][];
        date?: string;
        action?: "logged" | "updated";
        water: number;
        alcohol?: boolean;
        goals?: boolean;
        limits?: boolean;
    }
> = {
    typical: {
        list: [
            [OATS, "08:10"],
            [YOG, "10:40"],
            [SAND, "13:05"],
            [FLAT, "15:30"],
            [SALAD, "19:05"],
        ],
        water: 1600,
    },
    "long-names": {
        list: [
            [OATS, "08:10"],
            [LONG1, "09:20"],
            [YOG, "11:00"],
            [LONG2, "19:30"],
        ],
        water: 700,
    },
    "over-goal": {
        list: [
            [OATS, "08:10"],
            [YOG, "10:40"],
            [SAND, "13:05"],
            [FLAT, "15:30"],
            [SALAD, "19:05"],
            [IPA, "20:30"],
            [PIZZA, "21:40"],
        ],
        water: 1600,
        alcohol: true,
    },
    tiny: {
        list: [
            [OATS, "08:10"],
            [YOG, "10:40"],
            [SALAD, "13:05"],
            [FLAT, "15:30"],
            [COFFEE, "16:40"],
        ],
        water: 1600,
    },
    "edited-past": {
        list: [
            [OATS, "08:10"],
            [YOG, "10:40"],
            [SAND, "13:05"],
            [FLAT, "15:30"],
            [SALAD, "19:05"],
        ],
        date: "2026-10-09",
        action: "updated",
        water: 1600,
    },
    sparse: {
        list: [
            [LEFTOVERS, "12:30"],
            [CANTEEN, "18:50"],
        ],
        water: 0,
        limits: true,
    },
    busy: {
        list: [
            [OATS, "08:10"],
            [SNACK("Apple", 95, 25, 2), "09:30"],
            [YOG, "10:40"],
            [SAND, "13:05"],
            [SNACK("Banana", 105, 27, 1), "14:10"],
            [FLAT, "15:30"],
            [SNACK("Cola", 140, 35, 15), "16:20"],
            [SNACK("Potato chips", 160, 15, 150), "17:00"],
            [SALAD, "19:05"],
            [SNACK("Green tea", 2, 0, 2), "20:15"],
            [SNACK("Protein bar", 210, 22, 200), "21:10"],
        ],
        water: 2100,
    },
    "no-goals": {
        list: [
            [OATS, "08:10"],
            [SALAD, "13:05"],
        ],
        water: 0,
        goals: false,
    },
    "no-limits": {
        list: [
            [OATS, "08:10"],
            [YOG, "10:40"],
            [SALAD, "19:05"],
        ],
        water: 900,
        limits: false,
    },
};

export const ML_SCENARIO_NAMES = Object.keys(ML_SCENARIOS);

export function mealLoggedScenario(
    name: string,
): { result: unknown; meta: Record<string, unknown> } | null {
    const sc = ML_SCENARIOS[name];
    if (!sc) return null;
    const date = sc.date ?? TODAY;
    const alcohol = !!sc.alcohol;
    const { meals, items } = build(date, sc.list, { alcohol });
    const cur = meals[meals.length - 1]!;
    const hasGoals = sc.goals !== false;
    const limits = hasGoals && sc.limits !== false;
    const goals = hasGoals
        ? { ...GOALS, alcohol_g: alcohol ? 20 : null }
        : null;
    const result = {
        action: sc.action ?? "logged",
        date,
        drink_unit: alcohol ? "us" : null,
        locale: "en",
        logged_meal: {
            description: cur.description,
            meal_type: cur.meal_type,
            calories: cur.calories,
            protein_g: cur.protein_g,
            carbs_g: cur.carbs_g,
            fat_g: cur.fat_g,
            fiber_g: cur.fiber_g,
            sugar_g: cur.sugar_g,
            alcohol_g: alcohol ? cur.alcohol_g : null,
            caffeine_mg: cur.caffeine_mg,
        },
        has_goals: hasGoals,
        goals,
        totals: totalsOf(meals, sc.water, alcohol),
        meals: breakdown(meals, false, alcohol),
    };
    const days = { [date]: meals };
    const meta = {
        [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
            goal: limits ? LIMITS.added_sugar_g : null,
            days,
            meals,
        }),
        [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
            goal: limits ? LIMITS.saturated_fat_g : null,
            days,
            meals,
        }),
        [SODIUM_META_KEY]: buildSodiumMeta({
            goal: limits ? LIMITS.sodium_mg : null,
            days,
            meals,
        }),
        [MEAL_TIMES_META_KEY]: buildMealTimesMeta(meals, TZ, cur.id),
        ...itemsAndSources(meals, items, alcohol),
    };
    return { result, meta };
}

// ---------------------------------------------------------- nutrition-summary

/** A range day's totals: [date, kcal, p, c, f, fib, sug, add, sat, tr, caf, alc, water ml, sodium] */
type DayFx = [
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number | null,
    number,
    number,
    number | null,
];
const WEEK: (DayFx | [string])[] = [
    [
        "2026-10-18",
        2180,
        155,
        230,
        72,
        31.2,
        54.0,
        22.0,
        19.0,
        0.4,
        245,
        0,
        2400,
        1980,
    ],
    [
        "2026-10-19",
        2410,
        128,
        262,
        96,
        22.8,
        71.0,
        38.0,
        27.0,
        0.9,
        null,
        48.6,
        1800,
        3180,
    ],
    [
        "2026-10-20",
        1890,
        151,
        197,
        62,
        25.1,
        41.0,
        14.0,
        16.0,
        0.2,
        128,
        0,
        2100,
        2240,
    ],
    [
        "2026-10-21",
        2050,
        162,
        205,
        70,
        28.0,
        46.0,
        19.0,
        18.0,
        0.3,
        190,
        0,
        2600,
        2520,
    ],
    ["2026-10-22"],
    [
        "2026-10-23",
        1960,
        149,
        188,
        68,
        24.0,
        39.0,
        12.0,
        17.0,
        0.2,
        null,
        15.6,
        2000,
        1860,
    ],
    [
        "2026-10-24",
        1720,
        140,
        170,
        58,
        27.0,
        35.0,
        10.0,
        14.0,
        0.1,
        165,
        0,
        1700,
        1810,
    ],
];

function monthDays(): (DayFx | [string])[] {
    const out: (DayFx | [string])[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const gaps = new Set([2, 3, 5, 9, 10, 13, 16, 19, 20, 23, 26, 27]);
    for (let i = 0; i < 30; i++) {
        const d = new Date(Date.UTC(2026, 8, 25 + i, 12))
            .toISOString()
            .slice(0, 10);
        if (gaps.has(i)) {
            out.push([d]);
            continue;
        }
        const k = Math.round(1850 + rnd() * 900);
        out.push([
            d,
            k,
            Math.round(k * 0.062),
            Math.round(k * 0.105),
            Math.round(k * 0.036),
            round1(18 + rnd() * 14),
            round1(35 + rnd() * 35),
            round1(10 + rnd() * 26),
            round1(14 + rnd() * 12),
            round1(rnd() * 0.9),
            rnd() > 0.4 ? Math.round(90 + rnd() * 220) : null,
            rnd() > 0.75 ? round1(rnd() * 40) : 0,
            Math.round((1.4 + rnd() * 1.4) * 1000),
            i % 7 === 4
                ? null
                : Math.round((2050 + (((i * 53) % 17) / 16) * 1150) / 10) * 10,
        ]);
    }
    return out;
}

function summaryDay(name: string) {
    const dayLists: Record<
        string,
        {
            list: [MealFx, string][];
            date?: string;
            water: number;
            alcohol?: boolean;
            goals?: boolean;
            /** Bound the rows the way get_nutrition_summary does (each
             *  metric's top MEAL_BREAKDOWN_TOP_N), so the day arrives with
             *  fewer rows than meal_count. */
            trim?: boolean;
        }
    > = {
        today: {
            list: [
                [OATS, "08:10"],
                [YOG, "10:40"],
                [SAND, "13:05"],
                [FLAT, "15:30"],
                [SALAD, "19:20"],
            ],
            water: 1600,
        },
        "past-over": {
            list: [
                [OATS, "08:10"],
                [YOG, "10:40"],
                [SAND, "13:05"],
                [FLAT, "15:30"],
                [SALAD, "19:20"],
                [PIZZA, "20:45"],
                [IPA, "21:30"],
            ],
            date: "2026-10-09",
            water: 1200,
            alcohol: true,
        },
        "long-names": {
            list: [
                [OATS, "08:10"],
                [LONG1, "10:40"],
                [YOG, "13:05"],
                [LONG2, "15:30"],
            ],
            water: 700,
        },
        sparse: {
            list: [
                [LEFTOVERS, "12:30"],
                [COFFEE, "15:10"],
                [CANTEEN, "18:40"],
            ],
            water: 0,
        },
        nothing: { list: [], water: 0 },
        // Twelve meals: the green tea tops no metric, so the server drops
        // its row and meal_count (12) says so.
        trimmed: {
            list: [
                [OATS, "07:40"],
                [SNACK("Apple", 95, 25, 2), "09:30"],
                [YOG, "10:40"],
                [SAND, "13:05"],
                [SNACK("Banana", 105, 27, 1), "14:10"],
                [FLAT, "15:30"],
                [SNACK("Cola", 140, 35, 15), "16:20"],
                [SNACK("Potato chips", 160, 15, 150), "17:00"],
                [SALAD, "19:20"],
                [PIZZA, "20:45"],
                [SNACK("Protein bar", 210, 22, 200), "21:10"],
                [SNACK("Green tea", 2, 0, 2), "22:15"],
            ],
            water: 1400,
            trim: true,
        },
        "no-goals": {
            list: [
                [OATS, "08:10"],
                [SALAD, "13:05"],
            ],
            water: 500,
            goals: false,
        },
    };
    const sc = dayLists[name];
    if (!sc) return null;
    const date = sc.date ?? TODAY;
    const alcohol = !!sc.alcohol;
    const { meals, items } = build(date, sc.list, { alcohol });
    const goals =
        sc.goals === false
            ? null
            : { ...GOALS, alcohol_g: alcohol ? 20 : null };
    const t = totalsOf(meals, sc.water, alcohol);
    const rec = (k: keyof Meal) => (meals.some((m) => m[k] != null) ? 1 : 0);
    const allRows = breakdown(meals, true, alcohol);
    const kept = sc.trim ? topRows(allRows) : allRows.map((_, i) => i);
    const rows = kept.map((i) => allRows[i]!);
    const keptMeals = kept.map((i) => meals[i]!);
    const result = {
        start_date: date,
        end_date: date,
        logged_days: meals.length || sc.water ? 1 : 0,
        days_in_range: 1,
        drink_unit: alcohol ? "us" : null,
        locale: "en",
        goals,
        averages: t,
        recorded_days: {
            fiber_g: rec("fiber_g"),
            sugar_g: rec("sugar_g"),
            alcohol_g: alcohol ? rec("alcohol_g") : null,
            caffeine_mg: rec("caffeine_mg"),
        },
        days:
            meals.length || sc.water
                ? [{ date, meal_count: meals.length, ...t }]
                : [],
        meals: rows,
    };
    const lim = goals
        ? LIMITS
        : { added_sugar_g: null, saturated_fat_g: null, sodium_mg: null };
    const days = { [date]: meals };
    const count = (k: keyof Meal) =>
        meals.filter((m) => (Number(m[k]) || 0) > 0).length;
    const meta = {
        [MEAL_CONTRIBUTORS_META_KEY]: {
            calories: count("calories"),
            protein_g: count("protein_g"),
            carbs_g: count("carbs_g"),
            fat_g: count("fat_g"),
            fiber_g: count("fiber_g"),
            sugar_g: count("sugar_g"),
            alcohol_g: alcohol ? count("alcohol_g") : null,
            caffeine_mg: count("caffeine_mg"),
        },
        [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
            goal: lim.added_sugar_g,
            days,
            meals: keptMeals,
            contributorsOf: meals,
            extra: [],
        }),
        [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
            goal: lim.saturated_fat_g,
            days,
            meals: keptMeals,
            contributorsOf: meals,
            extra: [],
            transExtra: [],
        }),
        [SODIUM_META_KEY]: buildSodiumMeta({
            goal: lim.sodium_mg,
            days,
            meals: keptMeals,
            contributorsOf: meals,
            extra: [],
        }),
        [MEAL_TIMES_META_KEY]: buildMealTimesMeta(keptMeals, TZ),
        ...itemsAndSources(keptMeals, items, alcohol),
    };
    return { result, meta };
}

// topMealBreakdown's rule (src/mcp.ts, not importable here: it pulls in
// Supabase): the order-preserving union of each metric's top N rows with a
// value above 0, ties to the earlier row.
function topRows(rows: ReturnType<typeof breakdown>): number[] {
    const keys = [
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "caffeine_mg",
    ] as const;
    const keep = new Set<number>();
    for (const k of keys)
        rows.map((r, i) => ({ i, v: r[k] ?? 0 }))
            .filter((r) => r.v > 0)
            .sort((a, b) => b.v - a.v || a.i - b.i)
            .slice(0, MEAL_BREAKDOWN_TOP_N)
            .forEach((r) => keep.add(r.i));
    return rows.map((_, i) => i).filter((i) => keep.has(i));
}

function summaryRange(name: string) {
    const isWeek = name === "week";
    if (!isWeek && name !== "month-over") return null;
    const dayFx = isWeek ? WEEK : monthDays();
    const alcohol = true;
    const placed: [MealFx, string, string][] = isWeek
        ? [
              [PIZZA, "2026-10-19", "20:10"],
              [IPA, "2026-10-19", "21:40"],
              [OATS, "2026-10-20", "08:05"],
              [SALAD, "2026-10-24", "19:05"],
              [FLAT, "2026-10-18", "10:45"],
              [SAND, "2026-10-21", "13:10"],
              [YOG, "2026-10-23", "17:20"],
              [COFFEE, "2026-10-21", "09:15"],
          ]
        : [
              [PIZZA, "2026-09-26", "20:00"],
              [PIZZA, "2026-10-17", "21:15"],
              [IPA, "2026-10-17", "22:30"],
              [LONG2, "2026-10-23", "19:45"],
              [SALAD, "2026-10-24", "19:05"],
              [FLAT, "2026-10-24", "10:45"],
              [OATS, "2026-10-12", "08:05"],
          ];
    const all = placed.map(([fx, date, time], i) =>
        build(date, [[fx, time]], { alcohol, idBase: i * 10 }),
    );
    const meals = all
        .flatMap((b) => b.meals)
        .sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1));
    const items = new Map(all.flatMap((b) => [...b.items]));
    const logged = dayFx.filter((d): d is DayFx => d.length > 1);
    const days = logged.map((d) => ({
        date: d[0],
        meal_count: 4,
        calories: d[1],
        protein_g: d[2],
        carbs_g: d[3],
        fat_g: d[4],
        fiber_g: d[5],
        sugar_g: d[6],
        alcohol_g: d[11],
        caffeine_mg: d[10],
        water_ml: d[12],
    }));
    const avg = (xs: (number | null)[]) => {
        const v = xs.filter((x): x is number => x != null);
        return v.length
            ? round1(v.reduce((a, b) => a + b, 0) / v.length)
            : null;
    };
    const averages = {
        calories: Math.round(avg(days.map((d) => d.calories))!),
        protein_g: avg(days.map((d) => d.protein_g)),
        carbs_g: avg(days.map((d) => d.carbs_g)),
        fat_g: avg(days.map((d) => d.fat_g)),
        fiber_g: avg(days.map((d) => d.fiber_g)),
        sugar_g: avg(days.map((d) => d.sugar_g)),
        alcohol_g: avg(days.map((d) => d.alcohol_g)),
        caffeine_mg: avg(days.map((d) => d.caffeine_mg)),
        water_ml: Math.round(avg(days.map((d) => d.water_ml))!),
    };
    const start = dayFx[0]![0];
    const end = dayFx[dayFx.length - 1]![0];
    const rows = breakdown(meals, true, alcohol);
    const result = {
        start_date: start,
        end_date: end,
        logged_days: logged.length,
        days_in_range: dayFx.length,
        drink_unit: "us",
        locale: "en",
        goals: { ...GOALS },
        averages,
        recorded_days: {
            fiber_g: logged.length,
            sugar_g: logged.length,
            alcohol_g: logged.length,
            caffeine_mg: days.filter((d) => d.caffeine_mg != null).length,
        },
        days,
        meals: rows,
    };
    const dayMap = (i: number) =>
        Object.fromEntries(logged.map((d) => [d[0], d[i] as number | null]));
    const mealMap = (k: keyof Meal) =>
        Object.fromEntries(
            meals.map((m) => [
                m.id,
                m[k] == null ? null : round1(Number(m[k])),
            ]),
        );
    const total = logged.length * 4;
    const meta = {
        [MEAL_CONTRIBUTORS_META_KEY]: {
            calories: total,
            protein_g: total,
            carbs_g: total,
            fat_g: total,
            fiber_g: total - 3,
            sugar_g: total - 2,
            alcohol_g: isWeek ? 2 : 6,
            caffeine_mg: isWeek ? 5 : 14,
        },
        [ADDED_SUGAR_META_KEY]: {
            v: 1,
            goal: LIMITS.added_sugar_g,
            days: dayMap(7),
            meals: mealMap("added_sugar_g"),
            contributors: total - 4,
            extra: addedSugarExtra(
                meals,
                rows,
                meals.map((_, i) => i),
                MEAL_BREAKDOWN_TOP_N,
            ),
        },
        [SATURATED_FAT_META_KEY]: {
            v: 1,
            goal: LIMITS.saturated_fat_g,
            days: dayMap(8),
            meals: mealMap("saturated_fat_g"),
            contributors: total - 2,
            extra: saturatedFatExtra(
                meals,
                rows,
                meals.map((_, i) => i),
                MEAL_BREAKDOWN_TOP_N,
            ),
            trans: {
                days: dayMap(9),
                meals: mealMap("trans_fat_g"),
                contributors: total - 9,
                extra: transFatExtra(
                    meals,
                    rows,
                    meals.map((_, i) => i),
                    MEAL_BREAKDOWN_TOP_N,
                ),
            },
        },
        [SODIUM_META_KEY]: {
            v: 1,
            goal: LIMITS.sodium_mg,
            days: dayMap(13),
            meals: mealMap("sodium_mg"),
            contributors: total - 1,
            extra: sodiumExtra(
                meals,
                rows,
                meals.map((_, i) => i),
                MEAL_BREAKDOWN_TOP_N,
            ),
        },
        [MEAL_TIMES_META_KEY]: buildMealTimesMeta(meals, TZ),
        ...itemsAndSources(meals, items, alcohol),
    };
    return { result, meta };
}

export const SUMMARY_SCENARIO_NAMES = [
    "today",
    "past-over",
    "long-names",
    "sparse",
    "nothing",
    "no-goals",
    "week",
    "month-over",
];

export function summaryScenario(
    name: string,
): { result: unknown; meta: Record<string, unknown> } | null {
    return summaryDay(name) ?? summaryRange(name);
}
