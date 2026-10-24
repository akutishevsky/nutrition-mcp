// get_goal_progress fixtures for the widget harness (scripts/widget-harness.ts):
// the redesign's scenarios, built into a real tool result with the server's own
// `_meta` builders, so the widget is exercised against exactly what the tool
// sends. Dev-only, like the rest of scripts/.
//
//   /host?widget=goal-progress&gp=<scenario>
//
// typical (default) · long · over · past · sparse · small · weight · empty ·
// nogoals · nohistory. The design's foods double as the user's history: the
// `foods` list is built by historyFoods from every scenario's meals, except in
// `sparse` and `nohistory`, which have none (so no food is ever named).

import { buildAddedSugarMeta } from "../src/added-sugar.js";
import {
    buildGoalDayMeta,
    historyFoods,
    type GoalDayFood,
} from "../src/goal-day.js";
import { buildMealItemsMeta, type MealItemValues } from "../src/meal-items.js";
import {
    buildNutrientSourcesMeta,
    type NutrientSources,
} from "../src/provenance.js";
import { buildSaturatedFatMeta } from "../src/saturated-fat.js";
import { buildSodiumMeta } from "../src/sodium.js";
import type { Meal, WaterEntry } from "../src/supabase.js";
import {
    ADDED_SUGAR_META_KEY,
    GOAL_DAY_META_KEY,
    MEAL_ITEMS_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
} from "../src/widgets.js";

export const GOAL_PROGRESS_SCENARIOS = [
    "typical",
    "long",
    "over",
    "past",
    "sparse",
    "small",
    "weight",
    "empty",
    "nogoals",
    "nohistory",
] as const;
export type GoalProgressScenario = (typeof GOAL_PROGRESS_SCENARIOS)[number];

type Src = "usda" | "label" | "est";
// name, amount, unit, source, kcal, protein, carbs, fat, fiber, sugar, added
// sugar, saturated fat, trans fat, sodium mg (null = not recorded), caffeine
// mg, alcohol g
type Item = [
    string,
    number,
    string,
    Src,
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
    (number | null)?,
    (number | null)?,
];
interface DemoMeal {
    time: string;
    type: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    items?: Item[];
    tot?: Partial<Record<string, number | null>>;
}

const OATS: DemoMeal = {
    time: "08:10",
    type: "breakfast",
    name: "Overnight oats with berries",
    items: [
        ["Rolled oats", 60, "g", "usda", 228, 8, 40, 4, 6, 0.6, 0, 0.7, 0, 4],
        ["Milk 2%", 150, "ml", "label", 75, 5, 7, 3, 0, 7.5, 0, 1.9, 0.1, 66],
        ["Blueberries", 80, "g", "usda", 46, 1, 11, 0.3, 1.9, 8, 0, 0, 0, 1],
        ["Chia seeds", 15, "g", "est", 73, 2.5, 6, 4.6, 5.2, 0, 0, 0.5, 0, 2],
        ["Honey", 7, "g", "est", 21, 0, 6, 0, 0, 5.8, 5.8, 0, 0, 1],
    ],
};
const FLAT: DemoMeal = {
    time: "10:40",
    type: "snack",
    name: "Flat white",
    items: [
        [
            "Whole milk",
            160,
            "ml",
            "label",
            98,
            5.3,
            7.7,
            5.3,
            0,
            7.7,
            0,
            3.4,
            0.2,
            70,
        ],
        [
            "Espresso, double",
            60,
            "ml",
            "usda",
            2,
            0.1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            8,
            126,
        ],
    ],
};
const BOWL: DemoMeal = {
    time: "13:05",
    type: "lunch",
    name: "Grilled chicken & rice bowl",
    items: [
        [
            "Chicken breast, grilled",
            150,
            "g",
            "usda",
            248,
            46,
            0,
            5.4,
            0,
            0,
            0,
            1.5,
            0,
            110,
        ],
        [
            "Basmati rice, cooked",
            180,
            "g",
            "usda",
            234,
            4.9,
            51,
            0.5,
            0.7,
            0,
            0,
            0.1,
            0,
            2,
        ],
        [
            "Teriyaki sauce",
            30,
            "ml",
            "label",
            45,
            0.9,
            8.4,
            0,
            0,
            7.2,
            6.8,
            0,
            0,
            880,
        ],
        [
            "Broccoli, steamed",
            80,
            "g",
            "usda",
            27,
            2.2,
            5.3,
            0.3,
            2.1,
            1.4,
            0,
            0,
            0,
            33,
        ],
        ["Sesame oil", 5, "ml", "est", 41, 0, 0, 4.5, 0, 0, 0, 0.7, 0, 0],
    ],
};
const YOG: DemoMeal = {
    time: "16:20",
    type: "snack",
    name: "Greek yogurt & almonds",
    items: [
        [
            "Greek yogurt 2%",
            170,
            "g",
            "label",
            125,
            17,
            6,
            3.4,
            0,
            6,
            0,
            2.1,
            0.1,
            60,
        ],
        ["Almonds", 25, "g", "usda", 145, 5.3, 5.4, 12.5, 3.1, 1.1, 0, 1, 0, 1],
    ],
};
const DIN: DemoMeal = {
    time: "19:30",
    type: "dinner",
    name: "Salmon with quinoa & roasted veg",
    items: [
        [
            "Salmon fillet, baked",
            160,
            "g",
            "usda",
            330,
            35,
            0,
            21,
            0,
            0,
            0,
            4.2,
            0,
            98,
        ],
        [
            "Quinoa, cooked",
            150,
            "g",
            "usda",
            180,
            6.6,
            32,
            2.9,
            4.2,
            1.3,
            0,
            0.3,
            0,
            11,
        ],
        [
            "Roasted peppers & courgette",
            150,
            "g",
            "est",
            70,
            2,
            11,
            2.5,
            3,
            7,
            0,
            0.3,
            0,
            290,
        ],
    ],
};
const DIN2: DemoMeal = { ...DIN, items: DIN.items!.slice(0, 2) };
const WINE: DemoMeal = {
    time: "20:40",
    type: "snack",
    name: "Red wine, 2 glasses",
    items: [
        [
            "Red wine, dry",
            350,
            "ml",
            "est",
            300,
            0.2,
            9,
            0,
            0,
            2.2,
            0,
            0,
            0,
            14,
            null,
            37.2,
        ],
    ],
};
const PIZZA: DemoMeal = {
    time: "22:15",
    type: "snack",
    name: "Margherita pizza, 2 slices",
    items: [
        [
            "Pizza dough",
            160,
            "g",
            "est",
            410,
            13,
            58,
            9,
            3,
            2,
            1,
            2.5,
            0.2,
            860,
        ],
        [
            "Mozzarella",
            60,
            "g",
            "usda",
            170,
            13,
            1.3,
            13,
            0,
            0.6,
            0,
            8,
            0.1,
            375,
        ],
        ["Tomato sauce", 40, "g", "est", 20, 0.6, 3.5, 0.2, 1, 3, 0, 0, 0, 190],
    ],
};
const COLA: DemoMeal = {
    time: "15:10",
    type: "snack",
    name: "Cola",
    items: [
        ["Cola", 330, "ml", "label", 139, 0, 35, 0, 0, 35, 35, 0, 0, 35, 34],
    ],
};
const LONG: DemoMeal[] = [
    {
        time: "07:45",
        type: "breakfast",
        name: "Buckwheat porridge with banana, walnuts and a spoon of Ukrainian sunflower honey from the market",
        items: [
            [
                "Buckwheat groats, boiled in water (Ukrainian “Hrechka”, roasted, about 2.5× dry weight)",
                220,
                "g",
                "label",
                202,
                7.4,
                43,
                2,
                6.2,
                1.9,
                0,
                0.4,
                0,
                9,
            ],
            [
                "Banana, medium, sliced",
                118,
                "g",
                "usda",
                105,
                1.3,
                27,
                0.4,
                3.1,
                14.4,
                0,
                0.1,
                0,
                1,
            ],
            [
                "Walnuts, halves",
                20,
                "g",
                "usda",
                131,
                3,
                2.7,
                13,
                1.3,
                0.5,
                0,
                1.2,
                0,
                0,
            ],
            [
                "Sunflower honey",
                10,
                "g",
                "est",
                30,
                0,
                8.2,
                0,
                0,
                8.2,
                8.2,
                0,
                0,
                1,
            ],
        ],
    },
    {
        time: "11:05",
        type: "snack",
        name: "Drip coffee, 150 ml, Philips HD5120, batch 8 — Ethiopia Yirgacheffe washed, light roast",
        items: [
            [
                "Drip coffee, brewed (Philips HD5120, 9 g beans to 150 ml water)",
                150,
                "ml",
                "est",
                2,
                0.2,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                5,
                142,
            ],
        ],
    },
    {
        time: "14:00",
        type: "lunch",
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
                3.6,
                1.2,
                0,
                0.4,
                0,
                260,
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
                0,
                1.5,
                0.5,
                13.5,
                0.3,
                1350,
            ],
            [
                "Ketchup “Lagidnyi”, Torchyn",
                30,
                "g",
                "label",
                30,
                0,
                7,
                0,
                0.2,
                6.3,
                4.5,
                0,
                0,
                270,
            ],
            [
                "Hard cheese, grated (type not specified)",
                15,
                "g",
                "est",
                60,
                4,
                0,
                5,
                0,
                0,
                0,
                3.1,
                0.1,
                100,
            ],
        ],
    },
];
const SMALL: DemoMeal[] = [
    {
        time: "07:20",
        type: "breakfast",
        name: "Black coffee",
        items: [
            [
                "Black coffee, brewed",
                250,
                "ml",
                "usda",
                2,
                0.3,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                5,
                95,
            ],
        ],
    },
    {
        time: "08:05",
        type: "snack",
        name: "Apple",
        items: [
            [
                "Apple, medium",
                180,
                "g",
                "usda",
                95,
                0.5,
                25,
                0.3,
                4.4,
                19,
                0,
                0.1,
                0,
                2,
            ],
        ],
    },
];
const SPARSE: DemoMeal[] = [
    {
        time: "12:40",
        type: "lunch",
        name: "Leftovers",
        tot: {
            calories: 640,
            protein_g: 30,
            carbs_g: 60,
            fat_g: 28,
            fiber_g: 5,
            sugar_g: 6,
            sodium_mg: 1180,
        },
    },
    {
        time: "18:55",
        type: "dinner",
        name: "Something from the canteen",
        tot: {
            calories: 450,
            protein_g: 20,
            carbs_g: 50,
            fat_g: 18,
            fiber_g: null,
            sugar_g: 9,
        },
    },
];

const GOALS = {
    daily_calories: 2200,
    daily_protein_g: 160,
    daily_carbs_g: 220,
    daily_fat_g: 70,
    daily_fiber_g: 30,
    daily_sugar_g: 45,
    daily_added_sugar_g: 25,
    daily_saturated_fat_g: 20,
    daily_sodium_mg: 2300,
    daily_caffeine_mg: 400,
    daily_alcohol_g: 20,
    daily_water_ml: 2500,
};

const SRC_TAG: Record<Src, NutrientSources[keyof NutrientSources]> = {
    usda: { s: "usda", ref: "171477" },
    label: { s: "user" },
    est: { s: "estimate" },
};
const TAGGED = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "saturated_fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "caffeine_mg",
] as const;

const uuid = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function itemOf(it: Item, position: number): MealItemValues {
    const [name, amount, unit, src, kcal, p, c, f, fib, sug, add, sat, tr, na] =
        it;
    const tag = SRC_TAG[src]!;
    return {
        position,
        name,
        amount,
        unit,
        calories: kcal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        fiber_g: fib,
        sugar_g: sug,
        added_sugar_g: add,
        saturated_fat_g: sat,
        trans_fat_g: tr,
        sodium_mg: na,
        caffeine_mg: it[14] ?? null,
        alcohol_g: it[15] ?? null,
        nutrient_sources: Object.fromEntries(
            TAGGED.map((k) => [k, tag]),
        ) as NutrientSources,
        source_detail: null,
    };
}

const NUTRIENTS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "saturated_fat_g",
    "trans_fat_g",
    "sodium_mg",
    "caffeine_mg",
    "alcohol_g",
] as const;
const OPTIONAL = new Set(["caffeine_mg", "alcohol_g", "trans_fat_g"]);

function build(defs: DemoMeal[], date: string, seq: number) {
    const meals: Meal[] = [];
    const items = new Map<string, MealItemValues[]>();
    defs.forEach((d, k) => {
        const id = uuid(seq + k);
        const list = d.items?.map((it, i) => itemOf(it, i + 1));
        const v: Record<string, number | null> = {};
        for (const key of NUTRIENTS) {
            if (list) {
                const vals = list.map((x) => x[key] ?? null);
                v[key] = OPTIONAL.has(key)
                    ? vals.some((x) => x != null)
                        ? vals.reduce<number>((s, x) => s + (x ?? 0), 0)
                        : null
                    : vals.some((x) => x == null)
                      ? null
                      : vals.reduce<number>((s, x) => s + (x ?? 0), 0);
            } else v[key] = d.tot?.[key] ?? null;
        }
        meals.push({
            id,
            user_id: "u1",
            logged_at: `${date}T${d.time}:00Z`,
            meal_type: d.type,
            description: d.name,
            calories: v.calories!,
            protein_g: v.protein_g!,
            carbs_g: v.carbs_g!,
            fat_g: v.fat_g!,
            fiber_g: v.fiber_g!,
            sugar_g: v.sugar_g!,
            added_sugar_g: v.added_sugar_g!,
            saturated_fat_g: v.saturated_fat_g,
            trans_fat_g: v.trans_fat_g,
            sodium_mg: v.sodium_mg,
            caffeine_mg: v.caffeine_mg!,
            alcohol_g: v.alcohol_g!,
            notes: null,
            idempotency_key: null,
            saved_meal_id: null,
        });
        if (list) items.set(id, list);
    });
    return { meals, items };
}

const r1 = (v: number | null | undefined) =>
    v == null ? 0 : Math.round(v * 10) / 10;

function rowOf(m: Meal, alcoholOn: boolean) {
    return {
        description: m.description,
        meal_type: m.meal_type,
        date: null,
        calories: Math.round(m.calories ?? 0),
        protein_g: r1(m.protein_g),
        carbs_g: r1(m.carbs_g),
        fat_g: r1(m.fat_g),
        fiber_g: r1(m.fiber_g),
        sugar_g: r1(m.sugar_g),
        alcohol_g: alcoholOn ? r1(m.alcohol_g) : null,
        caffeine_mg: m.caffeine_mg == null ? null : r1(m.caffeine_mg),
    };
}

interface Spec {
    date: string;
    now: string | null;
    meals: DemoMeal[];
    water: [string, number][];
    alcohol: boolean;
    weight: {
        current: number | null;
        target: number | null;
        logged_on: string;
    } | null;
    goals: boolean;
    history: boolean;
}

const TODAY = "2026-10-24";
const WT: [string, number][] = [
    ["07:50", 300],
    ["09:30", 250],
    ["11:45", 500],
    ["14:10", 330],
];
const SPECS: Record<GoalProgressScenario, Spec> = {
    typical: {
        date: TODAY,
        now: "20:45",
        meals: [OATS, FLAT, BOWL, YOG, DIN2],
        water: WT,
        alcohol: true,
        weight: { current: 78.4, target: 75, logged_on: "2026-10-23" },
        goals: true,
        history: true,
    },
    nohistory: {
        date: TODAY,
        now: "20:45",
        meals: [OATS, FLAT, BOWL, YOG, DIN2],
        water: WT,
        alcohol: true,
        weight: { current: 78.4, target: 75, logged_on: "2026-10-23" },
        goals: true,
        history: false,
    },
    long: {
        date: TODAY,
        now: "16:40",
        meals: [...LONG, YOG],
        water: [
            ["08:00", 250],
            ["12:30", 500],
            ["16:00", 330],
        ],
        alcohol: false,
        weight: { current: 81.2, target: 76.5, logged_on: TODAY },
        goals: true,
        history: true,
    },
    over: {
        date: TODAY,
        now: "22:30",
        meals: [OATS, FLAT, BOWL, COLA, YOG, DIN, WINE, PIZZA],
        water: [
            ["08:00", 250],
            ["13:00", 330],
            ["18:30", 300],
        ],
        alcohol: true,
        weight: { current: 78.9, target: 75, logged_on: TODAY },
        goals: true,
        history: true,
    },
    past: {
        date: "2026-10-09",
        now: null,
        meals: [OATS, BOWL, YOG, DIN2],
        water: [
            ["09:00", 500],
            ["13:30", 500],
            ["17:00", 500],
            ["21:00", 600],
        ],
        alcohol: true,
        weight: { current: 79.6, target: 75, logged_on: "2026-10-08" },
        goals: true,
        history: true,
    },
    sparse: {
        date: TODAY,
        now: "19:20",
        meals: SPARSE,
        water: [],
        alcohol: false,
        weight: { current: 78.4, target: null, logged_on: "2026-10-20" },
        goals: true,
        history: false,
    },
    small: {
        date: TODAY,
        now: "08:30",
        meals: SMALL,
        water: [["07:10", 250]],
        alcohol: true,
        weight: { current: 74.8, target: 75, logged_on: TODAY },
        goals: true,
        history: true,
    },
    weight: {
        date: TODAY,
        now: "09:15",
        meals: [],
        water: [],
        alcohol: false,
        weight: { current: 78.4, target: 75, logged_on: TODAY },
        goals: true,
        history: true,
    },
    empty: {
        date: TODAY,
        now: "07:05",
        meals: [],
        water: [],
        alcohol: false,
        weight: null,
        goals: true,
        history: false,
    },
    nogoals: {
        date: TODAY,
        now: "13:30",
        meals: [OATS, BOWL],
        water: WT.slice(0, 2),
        alcohol: false,
        weight: { current: 78.4, target: null, logged_on: TODAY },
        goals: false,
        history: true,
    },
};

/** The tool result and `_meta` get_goal_progress would send for a scenario. */
export function goalProgressFixture(
    scenario: string,
    drinkUnit: "us" | "uk",
): { result: Record<string, unknown>; meta: Record<string, unknown> } {
    const spec =
        SPECS[
            (GOAL_PROGRESS_SCENARIOS as readonly string[]).includes(scenario)
                ? (scenario as GoalProgressScenario)
                : "typical"
        ];
    const { meals, items } = build(spec.meals, spec.date, 1);
    const water: WaterEntry[] = spec.water.map(([t, ml], i) => ({
        id: uuid(900 + i),
        user_id: "u1",
        amount_ml: ml,
        logged_at: `${spec.date}T${t}:00Z`,
        notes: null,
        created_at: `${spec.date}T${t}:00Z`,
        idempotency_key: null,
    }));
    const alcoholOn = spec.alcohol;
    const sum = (k: keyof Meal) =>
        meals.reduce((s, m) => s + ((m[k] as number | null) ?? 0), 0);
    const has = (k: keyof Meal) => meals.some((m) => m[k] != null);
    const waterMl = water.reduce((s, w) => s + w.amount_ml, 0);
    const goals = spec.goals ? GOALS : null;

    // The user's history: every demo meal, logged a few days earlier.
    let foods: GoalDayFood[] | undefined;
    if (spec.now) {
        if (spec.history) {
            const pool = [
                OATS,
                FLAT,
                BOWL,
                YOG,
                DIN,
                WINE,
                PIZZA,
                COLA,
                ...LONG,
                ...SMALL,
            ];
            const hist = build(pool, "2026-10-20", 100);
            const all = [...hist.meals, ...meals];
            foods = historyFoods(all, new Map([...hist.items, ...items]));
        } else {
            // A user with no history to draw on: nothing is ever named.
            foods = [];
        }
    }

    const result = {
        date: spec.date,
        drink_unit: alcoholOn ? drinkUnit : null,
        locale: "en",
        meal_count: meals.length,
        water_entries: water.length,
        goals: goals
            ? {
                  calories: goals.daily_calories,
                  protein_g: goals.daily_protein_g,
                  carbs_g: goals.daily_carbs_g,
                  fat_g: goals.daily_fat_g,
                  fiber_g: goals.daily_fiber_g,
                  sugar_g: goals.daily_sugar_g,
                  alcohol_g: alcoholOn ? goals.daily_alcohol_g : null,
                  caffeine_mg: goals.daily_caffeine_mg,
                  water_ml: goals.daily_water_ml,
              }
            : null,
        totals: {
            calories: Math.round(sum("calories")),
            protein_g: r1(sum("protein_g")),
            carbs_g: r1(sum("carbs_g")),
            fat_g: r1(sum("fat_g")),
            fiber_g: r1(sum("fiber_g")),
            sugar_g: r1(sum("sugar_g")),
            alcohol_g: alcoholOn ? r1(sum("alcohol_g")) : null,
            caffeine_mg: has("caffeine_mg") ? r1(sum("caffeine_mg")) : null,
            water_ml: waterMl,
        },
        weight: spec.weight ? { ...spec.weight, unit: "kg" } : null,
        meals: meals.map((m) => rowOf(m, alcoholOn)),
    };
    const days = { [spec.date]: meals };
    const itemsMeta = buildMealItemsMeta(meals, items, alcoholOn);
    const sources = buildNutrientSourcesMeta(
        meals,
        new Map(),
        items,
        alcoholOn,
    );
    const meta: Record<string, unknown> = {
        [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
            goal: goals?.daily_added_sugar_g,
            days,
            meals,
        }),
        [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
            goal: goals?.daily_saturated_fat_g,
            days,
            meals,
        }),
        [SODIUM_META_KEY]: buildSodiumMeta({
            goal: goals?.daily_sodium_mg,
            days,
            meals,
        }),
        ...(itemsMeta ? { [MEAL_ITEMS_META_KEY]: itemsMeta } : {}),
        ...(sources ? { [NUTRIENT_SOURCES_META_KEY]: sources } : {}),
        [GOAL_DAY_META_KEY]: buildGoalDayMeta({
            meals,
            water,
            tz: "UTC",
            now: spec.now ? new Date(`${spec.date}T${spec.now}:00Z`) : null,
            foods,
        }),
    };
    return { result, meta };
}
