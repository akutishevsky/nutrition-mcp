// Harness fixture for the digest widget (scripts/widget-harness.ts).
//
// One coherent 61-day log per scenario, generated deterministically (the same
// seeded generator the design used), then run through the server's own
// computeDigest — so the harness shows exactly the payload get_digest would
// send for that history. "Today" is Sat 24 Oct 2026, now 17:40 UTC.
//
//   ?period=yesterday|today|last_7_days|last_30_days   (default yesterday)
//   ?scenario=typical|great|rough|sparse|empty|long|nogoals|nosodium
//   ?unit=lb            weight in pounds
//   ?drinkUnit=us|uk    alcohol tracking on (default off: no alcohol anywhere)

import {
    computeDigest,
    DIGEST_PERIODS,
    type DigestPeriod,
} from "../src/digest.js";
import type { MealItemValues } from "../src/meal-items.js";
import type {
    Meal,
    NutritionGoals,
    WaterEntry,
    WeightEntry,
} from "../src/supabase.js";
import { DIGEST_META_KEY } from "../src/widgets.js";

type Item = [name: string, amount: string, kcal: number];
interface Nut {
    kcal?: number;
    p: number;
    c: number;
    f: number;
    fib: number;
    sug: number;
    add: number | "nr";
    sat: number | "nr";
    tr: number | "nr";
    na: number | "nr";
    caf?: number;
    alc?: number;
}
interface Proto {
    type: string | null;
    name: string;
    items: Item[];
    n: Nut;
}

const I = (n: string, a: string, k: number): Item => [n, a, k];
const ML = (
    type: string | null,
    name: string,
    items: Item[],
    n: Nut,
): Proto => ({
    type,
    name,
    items,
    n,
});

const C: Record<string, Proto> = {
    OATS: ML(
        "Breakfast",
        "Overnight oats with berries",
        [
            I("Rolled oats", "60 g", 228),
            I("Milk 2%", "150 ml", 75),
            I("Blueberries", "80 g", 46),
            I("Chia seeds", "15 g", 71),
        ],
        {
            p: 18,
            c: 62,
            f: 12,
            fib: 9.4,
            sug: 18.2,
            add: 2,
            sat: 2.1,
            tr: 0,
            na: 73,
        },
    ),
    EGGS: ML(
        "Breakfast",
        "Scrambled eggs on sourdough",
        [
            I("Eggs, scrambled", "3 large", 216),
            I("Sourdough toast", "2 slices", 180),
            I("Butter", "10 g", 72),
        ],
        {
            p: 24,
            c: 36,
            f: 26,
            fib: 2,
            sug: 3,
            add: 0.5,
            sat: 11,
            tr: 0.3,
            na: 620,
        },
    ),
    YOGB: ML(
        "Breakfast",
        "Greek yogurt bowl with granola",
        [
            I("Greek yogurt 2%", "200 g", 146),
            I("Granola", "45 g", 200),
            I("Banana", "½ medium", 53),
        ],
        { p: 24, c: 52, f: 10, fib: 4, sug: 26, add: 9, sat: 3, tr: 0, na: 95 },
    ),
    CROIS: ML(
        "Breakfast",
        "Croissant & cappuccino",
        [I("Butter croissant", "1 large", 231), I("Cappuccino", "300 ml", 110)],
        {
            p: 9,
            c: 32,
            f: 19,
            fib: 1.5,
            sug: 12,
            add: 5,
            sat: 11,
            tr: 0.4,
            na: 420,
            caf: 75,
        },
    ),
    SAND: ML(
        "Lunch",
        "Turkey & avocado sandwich",
        [
            I("Whole-wheat bread", "2 slices", 200),
            I("Turkey breast", "90 g", 90),
            I("Avocado", "½ fruit", 80),
            I("Mustard", "10 g", 10),
        ],
        {
            p: 34,
            c: 42,
            f: 12,
            fib: 9,
            sug: 6,
            add: 1.5,
            sat: 2,
            tr: 0,
            na: 1120,
        },
    ),
    BOWL: ML(
        "Lunch",
        "Chicken & rice teriyaki bowl",
        [
            I("Chicken thigh, grilled", "150 g", 280),
            I("Jasmine rice", "200 g", 260),
            I("Edamame", "60 g", 70),
            I("Teriyaki sauce", "30 ml", 40),
        ],
        {
            p: 52,
            c: 78,
            f: 17,
            fib: 6,
            sug: 9,
            add: 7,
            sat: 3.6,
            tr: 0.1,
            na: 1400,
        },
    ),
    SALAD: ML(
        "Lunch",
        "Grilled chicken salad",
        [
            I("Chicken breast, grilled", "110 g", 182),
            I("Croutons", "29 g", 118),
            I("Olive oil vinaigrette", "15 ml", 116),
            I("Feta", "30 g", 79),
            I("Mixed greens & tomatoes", "140 g", 25),
        ],
        {
            p: 42,
            c: 28,
            f: 22,
            fib: 3.5,
            sug: 5,
            add: 0.8,
            sat: 5.1,
            tr: 0.1,
            na: 888,
        },
    ),
    SOUP: ML(
        "Lunch",
        "Lentil soup & rye bread",
        [I("Red lentil soup", "400 ml", 320), I("Rye bread", "2 slices", 160)],
        {
            p: 24,
            c: 72,
            f: 8,
            fib: 16,
            sug: 7,
            add: 0,
            sat: 1.5,
            tr: 0,
            na: 1050,
        },
    ),
    RAMEN: ML(
        "Lunch",
        "Tonkotsu ramen",
        [
            I("Ramen noodles", "180 g", 380),
            I("Pork bone broth", "450 ml", 240),
            I("Chashu pork", "60 g", 180),
            I("Soft-boiled egg", "1", 70),
        ],
        {
            p: 38,
            c: 96,
            f: 36,
            fib: 4,
            sug: 6,
            add: 2,
            sat: 12,
            tr: 0.2,
            na: 2650,
        },
    ),
    BURR: ML(
        "Lunch",
        "Steak burrito",
        [
            I("Flour tortilla", "110 g", 330),
            I("Grilled steak", "120 g", 250),
            I("Rice & beans", "150 g", 110),
            I("Salsa & sour cream", "60 g", 30),
        ],
        {
            p: 48,
            c: 66,
            f: 30,
            fib: 8.2,
            sug: 7.9,
            add: 1.2,
            sat: 9,
            tr: 0.6,
            na: 1420,
        },
    ),
    SALMON: ML(
        "Dinner",
        "Salmon with quinoa & veg",
        [
            I("Atlantic salmon, baked", "150 g", 310),
            I("Quinoa", "150 g", 180),
            I("Roasted broccoli", "120 g", 80),
            I("Lemon butter", "10 g", 70),
        ],
        {
            p: 44,
            c: 40,
            f: 34,
            fib: 7.1,
            sug: 4.2,
            add: 0,
            sat: 6.8,
            tr: 0.2,
            na: 205,
        },
    ),
    PIZZA: ML(
        "Dinner",
        "Margherita pizza, 3 slices",
        [
            I("Pizza dough", "240 g", 620),
            I("Mozzarella", "90 g", 254),
            I("Olive oil", "8 ml", 72),
            I("Tomato sauce", "60 g", 30),
        ],
        {
            p: 39,
            c: 117,
            f: 35,
            fib: 4.3,
            sug: 8.4,
            add: 3,
            sat: 12,
            tr: 0.3,
            na: 1960,
        },
    ),
    PASTA: ML(
        "Dinner",
        "Spaghetti bolognese",
        [
            I("Spaghetti", "220 g cooked", 350),
            I("Beef ragù", "200 g", 330),
            I("Parmesan", "10 g", 40),
        ],
        {
            p: 38,
            c: 88,
            f: 22,
            fib: 7,
            sug: 12,
            add: 3,
            sat: 8,
            tr: 0.3,
            na: 980,
        },
    ),
    STIR: ML(
        "Dinner",
        "Tofu & vegetable stir-fry with rice",
        [
            I("Firm tofu", "150 g", 220),
            I("Stir-fry vegetables", "200 g", 90),
            I("Brown rice", "150 g", 170),
            I("Soy & ginger sauce", "30 ml", 80),
        ],
        {
            p: 28,
            c: 74,
            f: 16,
            fib: 8,
            sug: 11,
            add: 4,
            sat: 2,
            tr: 0,
            na: 1280,
        },
    ),
    CHKD: ML(
        "Dinner",
        "Roast chicken, potatoes & greens",
        [
            I("Roast chicken breast", "200 g", 300),
            I("Roast potatoes", "200 g", 180),
            I("Green beans", "100 g", 40),
            I("Gravy", "60 ml", 60),
        ],
        {
            p: 52,
            c: 42,
            f: 20,
            fib: 6,
            sug: 3,
            add: 0.5,
            sat: 5,
            tr: 0.1,
            na: 760,
        },
    ),
    BURGER: ML(
        "Dinner",
        "Cheeseburger & fries",
        [I("Cheeseburger", "1", 540), I("French fries", "medium", 365)],
        {
            p: 34,
            c: 88,
            f: 46,
            fib: 6,
            sug: 10,
            add: 6,
            sat: 16,
            tr: 1.1,
            na: 1610,
        },
    ),
    FLAT: ML(
        "Snack",
        "Flat white",
        [I("Whole milk", "160 ml", 118), I("Espresso, double", "60 ml", 2)],
        {
            p: 7,
            c: 10,
            f: 6,
            fib: 0,
            sug: 10,
            add: 0,
            sat: 3.8,
            tr: 0.2,
            na: 75,
            caf: 128,
        },
    ),
    COLD: ML(
        "Snack",
        "Cold brew, large",
        [I("Cold brew coffee", "600 ml", 15)],
        {
            p: 0,
            c: 2,
            f: 0,
            fib: 0,
            sug: 0,
            add: 0,
            sat: 0,
            tr: 0,
            na: 10,
            caf: 190,
        },
    ),
    APPLE: ML(
        "Snack",
        "Apple & peanut butter",
        [I("Apple", "1 medium", 95), I("Peanut butter", "32 g", 190)],
        { p: 8, c: 30, f: 16, fib: 6, sug: 21, add: 2, sat: 3, tr: 0, na: 150 },
    ),
    SHAKE: ML(
        "Snack",
        "Protein shake",
        [I("Whey isolate", "45 g", 170), I("Oat milk", "250 ml", 40)],
        {
            p: 40,
            c: 8,
            f: 3,
            fib: 0.8,
            sug: 4.2,
            add: 1,
            sat: 0.6,
            tr: 0,
            na: 240,
        },
    ),
    YOG: ML(
        "Snack",
        "Greek yogurt & almonds",
        [
            I("Greek yogurt 2%", "170 g", 125),
            I("Almonds", "20 g", 116),
            I("Honey", "6 g", 19),
        ],
        {
            p: 22,
            c: 14,
            f: 14,
            fib: 2.4,
            sug: 9.1,
            add: 5,
            sat: 2.6,
            tr: 0.1,
            na: 62,
        },
    ),
    CHOC: ML(
        "Snack",
        "Dark chocolate, 4 squares",
        [I("Dark chocolate 70%", "40 g", 220)],
        {
            p: 3,
            c: 16,
            f: 16,
            fib: 3,
            sug: 13,
            add: 12,
            sat: 9,
            tr: 0,
            na: 8,
            caf: 32,
        },
    ),
    COOKIE: ML(
        "Snack",
        "Oat & raisin cookies",
        [I("Oat & raisin cookies", "2 × 30 g", 260)],
        {
            p: 3,
            c: 36,
            f: 12,
            fib: 2,
            sug: 18,
            add: 16,
            sat: 6,
            tr: 0.2,
            na: 180,
        },
    ),
    COLA: ML("Drink", "Cola, 500 ml", [I("Cola", "500 ml", 210)], {
        p: 0,
        c: 53,
        f: 0,
        fib: 0,
        sug: 53,
        add: 53,
        sat: 0,
        tr: 0,
        na: 20,
        caf: 48,
    }),
    IPA: ML("Drink", "Craft IPA, 2 pints", [I("IPA 6.5%", "2 × 473 ml", 420)], {
        p: 4,
        c: 32,
        f: 0,
        fib: 0,
        sug: 0,
        add: 0,
        sat: 0,
        tr: 0,
        na: 28,
        alc: 48.6,
    }),
    WINE: ML("Drink", "Glass of red wine", [I("Red wine 13%", "150 ml", 125)], {
        p: 0,
        c: 4,
        f: 0,
        fib: 0,
        sug: 0.9,
        add: 0,
        sat: 0,
        tr: 0,
        na: 6,
        alc: 15.6,
    }),
    LEFT: ML(null, "Leftovers", [], {
        kcal: 640,
        p: 30,
        c: 60,
        f: 28,
        fib: 5,
        sug: 8,
        add: "nr",
        sat: "nr",
        tr: "nr",
        na: "nr",
    }),
    CANT: ML(null, "Something from the canteen", [], {
        kcal: 450,
        p: 20,
        c: 50,
        f: 18,
        fib: 3,
        sug: 6,
        add: "nr",
        sat: "nr",
        tr: "nr",
        na: "nr",
    }),
    SNAK: ML(null, "Crackers & cheese", [], {
        kcal: 310,
        p: 12,
        c: 26,
        f: 18,
        fib: 1,
        sug: 2,
        add: "nr",
        sat: "nr",
        tr: "nr",
        na: "nr",
    }),
    LB: ML(
        "Breakfast",
        "Buckwheat porridge with banana, walnuts and a spoon of Ukrainian sunflower honey from the market",
        [
            I(
                "Buckwheat groats, boiled in water (Ukrainian “Hrechka”, roasted, about 2.5× dry weight)",
                "220 g",
                202,
            ),
            I("Banana, medium, sliced", "118 g", 105),
            I("Walnuts, halves", "20 g", 131),
            I("Sunflower honey", "10 g", 30),
        ],
        {
            p: 12,
            c: 81,
            f: 15,
            fib: 10.6,
            sug: 25,
            add: 8.2,
            sat: 1.7,
            tr: 0,
            na: 12,
        },
    ),
    LC: ML(
        "Snack",
        "Drip coffee, 150 ml, Philips HD5120, batch 8 — Ethiopia Yirgacheffe washed, light roast",
        [
            I(
                "Drip coffee, brewed (Philips HD5120, 9 g beans to 150 ml water)",
                "150 ml",
                2,
            ),
        ],
        {
            p: 0,
            c: 0,
            f: 0,
            fib: 0,
            sug: 0,
            add: 0,
            sat: 0,
            tr: 0,
            na: 5,
            caf: 142,
        },
    ),
    LL: ML(
        "Lunch",
        "Fusilli with Globyno “Nyamski” sausages: boiled pasta, three sausages, mild Torchyn ketchup and grated hard cheese",
        [
            I(
                "Fusilli pasta, boiled (Barilla n.98, cooked weight about 2.5× dry)",
                "200 g",
                314,
            ),
            I("Pork sausages “Nyamski”, Globyno", "150 g", 405),
            I("Ketchup “Lagidnyi”, Torchyn", "30 g", 30),
            I("Hard cheese, grated (type not specified)", "15 g", 60),
        ],
        {
            p: 33,
            c: 72,
            f: 43,
            fib: 3.8,
            sug: 9,
            add: 4.5,
            sat: 16.6,
            tr: 0.4,
            na: 1980,
        },
    ),
    LD: ML(
        "Dinner",
        "Chicken Kyiv with mashed potatoes, pickled cucumbers and a dill-garlic sour cream sauce (homemade, family recipe)",
        [
            I(
                "Chicken Kyiv, pan-fried (breaded chicken breast with herb butter)",
                "220 g",
                530,
            ),
            I("Mashed potatoes with milk and butter", "200 g", 230),
            I("Pickled cucumbers", "80 g", 10),
            I("Dill-garlic sour cream sauce", "40 g", 80),
        ],
        {
            p: 46,
            c: 48,
            f: 44,
            fib: 4,
            sug: 5,
            add: 0,
            sat: 19,
            tr: 0.6,
            na: 1690,
        },
    ),
};

interface Prof {
    seed: number;
    gaps?: number[];
    only?: number[];
    thin?: boolean;
    B?: string;
    S?: string;
    S3?: string;
    L?: string;
    D?: string;
    A?: string;
    s2?: number;
    s3?: number;
    aWE?: number;
    aWD?: number;
    wm?: number;
    wv?: number;
    wr?: number;
    wp: number;
    w0: number;
    w1: number;
    noCaf?: boolean;
    wOnly?: [number, number][];
    ov?: Record<number, [string, string][]>;
    wov?: Record<number, number>;
}
const BASE = {
    B: "OATS*2 EGGS YOGB*2 CROIS",
    S: "FLAT*3 COLD*2 APPLE*2 SHAKE*2 YOG*2 CHOC COOKIE COLA",
    L: "SAND*2 BOWL*2 SALAD*2 SOUP RAMEN BURR",
    D: "SALMON*2 PASTA*2 STIR*2 CHKD*2 PIZZA BURGER",
    A: "IPA WINE*2",
};
const PROF: Record<string, Prof> = {
    typical: {
        seed: 11,
        gaps: [5, 12, 19, 26, 33, 41, 47, 55],
        ...BASE,
        s2: 0.5,
        aWE: 0.55,
        aWD: 0.08,
        wm: 2.15,
        wv: 0.55,
        wp: 0.7,
        w0: 79.6,
        w1: 78.3,
        ov: {
            0: [
                ["OATS", "08:05"],
                ["FLAT", "10:40"],
                ["BOWL", "13:05"],
                ["APPLE", "15:30"],
                ["SALMON", "19:30"],
            ],
            1: [
                ["YOGB", "08:10"],
                ["COLD", "10:30"],
                ["RAMEN", "13:00"],
                ["SHAKE", "16:10"],
                ["CHKD", "19:40"],
            ],
            2: [
                ["EGGS", "08:20"],
                ["FLAT", "10:50"],
                ["SAND", "12:55"],
                ["CHOC", "15:45"],
                ["PASTA", "19:15"],
                ["WINE", "21:05"],
            ],
        },
        wov: { 0: 2.4, 1: 1.9, 2: 2.3 },
    },
    great: {
        seed: 23,
        gaps: [9, 30, 52],
        B: "OATS*3 EGGS*2 YOGB",
        S: "SHAKE*3 YOG*2 FLAT*2 COLD",
        S3: "SHAKE*2 YOG",
        L: "SALAD*2 SOUP*3 SAND BOWL",
        D: "CHKD*3 SALMON*2 STIR PASTA",
        A: "WINE",
        s2: 1,
        s3: 0.7,
        aWE: 0.15,
        aWD: 0,
        wm: 2.65,
        wv: 0.3,
        wp: 0.9,
        w0: 80.4,
        w1: 78.1,
        ov: {
            0: [
                ["OATS", "07:50"],
                ["FLAT", "10:20"],
                ["SALAD", "12:45"],
                ["SHAKE", "16:00"],
                ["SALMON", "19:10"],
            ],
            1: [
                ["OATS", "08:00"],
                ["COLD", "10:30"],
                ["SOUP", "13:00"],
                ["SHAKE", "16:00"],
                ["CHKD", "19:20"],
                ["YOG", "21:00"],
            ],
        },
        wov: { 0: 2.2, 1: 2.8 },
    },
    rough: {
        seed: 37,
        gaps: [4, 11, 16, 23, 37, 44],
        B: "CROIS*3 EGGS -*2",
        S: "COLA*3 COOKIE*3 CHOC*2 FLAT*2 COLD",
        L: "BURR*2 RAMEN*2 BOWL SAND",
        D: "PIZZA*3 BURGER*2 PASTA*2 CHKD",
        A: "IPA*2 WINE",
        s2: 0.85,
        aWE: 0.7,
        aWD: 0.25,
        wm: 1.35,
        wv: 0.4,
        wp: 0.5,
        w0: 77.6,
        w1: 78.9,
        ov: {
            0: [
                ["CROIS", "08:40"],
                ["COLD", "10:15"],
                ["BURR", "13:20"],
                ["COLA", "15:50"],
                ["PIZZA", "20:00"],
            ],
            1: [
                ["CROIS", "08:30"],
                ["COLA", "11:00"],
                ["BURGER", "13:10"],
                ["COOKIE", "16:00"],
                ["PIZZA", "20:00"],
                ["IPA", "21:30"],
            ],
        },
        wov: { 0: 0.8, 1: 1.1 },
    },
    sparse: {
        seed: 51,
        only: [
            0, 1, 3, 6, 8, 10, 14, 17, 21, 25, 28, 29, 33, 36, 40, 44, 50, 52,
            58,
        ],
        thin: true,
        ...BASE,
        L: "SAND BOWL LEFT*2 CANT*2",
        D: "PASTA CHKD LEFT CANT SNAK*2",
        s2: 0.2,
        aWE: 0.2,
        aWD: 0,
        wm: 1.6,
        wv: 0.4,
        wr: 0.35,
        wp: 0.18,
        w0: 79.0,
        w1: 78.6,
        noCaf: true,
        ov: {
            0: [["CANT", "13:20"]],
            1: [
                ["LEFT", "12:40"],
                ["SAND", "19:10"],
            ],
        },
        wov: { 0: 0, 1: 0.75 },
    },
    empty: {
        seed: 3,
        only: [],
        wp: 0,
        w0: 79.4,
        w1: 79.4,
        wOnly: [[41, 79.4]],
    },
    long: {
        seed: 11,
        gaps: [5, 12, 19, 26, 33, 41, 47, 55],
        ...BASE,
        B: "LB*2 OATS EGGS",
        S: "LC*3 FLAT APPLE SHAKE YOG",
        L: "LL*2 SAND BOWL SALAD",
        D: "LD*2 SALMON PASTA STIR",
        s2: 0.5,
        aWE: 0.5,
        aWD: 0.08,
        wm: 2.1,
        wv: 0.5,
        wp: 0.7,
        w0: 79.6,
        w1: 78.3,
        ov: {
            0: [
                ["LB", "08:05"],
                ["LC", "10:40"],
                ["LL", "13:05"],
                ["YOG", "15:30"],
                ["SALMON", "19:30"],
            ],
            1: [
                ["LB", "08:10"],
                ["LC", "10:30"],
                ["SALAD", "13:00"],
                ["SHAKE", "16:10"],
                ["LD", "19:40"],
            ],
        },
        wov: { 0: 2.0, 1: 1.7 },
    },
};

const NOW = new Date("2026-10-24T17:40:00Z");
const DAY0 = Date.UTC(2026, 9, 24);

function build(scenario: string) {
    const P = PROF[scenario] ?? PROF.typical!;
    let s = P.seed;
    const rnd = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    const pool = (str: string) => {
        const o: string[] = [];
        for (const x of str.split(" ")) {
            const [k, n] = x.split("*");
            for (let j = 0; j < (Number(n) || 1); j++) o.push(k!);
        }
        return o;
    };
    const pick = (str: string) => {
        const a = pool(str);
        return a[Math.floor(rnd() * a.length) % a.length]!;
    };
    const tm = (m: number) =>
        String(Math.floor(m / 60)).padStart(2, "0") +
        ":" +
        String(Math.round(m % 60) % 60).padStart(2, "0");
    const meals: Meal[] = [];
    const water: WaterEntry[] = [];
    const weights: WeightEntry[] = [];
    const items = new Map<string, MealItemValues[]>();
    let id = 0;
    for (let i = 0; i <= 60; i++) {
        const date = new Date(DAY0 - i * 86_400_000);
        const iso = date.toISOString().slice(0, 10);
        const wd = date.getUTCDay();
        const logged = P.only
            ? P.only.includes(i)
            : !(P.gaps ?? []).includes(i);
        const day: { k: string; t: string }[] = [];
        const add = (k: string, t: string) => {
            if (k && k !== "-" && C[k]) day.push({ k, t });
        };
        if (P.ov?.[i]) for (const [k, t] of P.ov[i]!) add(k, t);
        else if (logged && P.thin) {
            const n = 1 + (rnd() < 0.45 ? 1 : 0);
            add(pick(P.L!), tm(745 + rnd() * 50));
            if (n > 1) add(pick(P.D!), tm(1140 + rnd() * 60));
        } else if (logged && P.B) {
            add(pick(P.B), tm(460 + rnd() * 50));
            add(pick(P.S!), tm(625 + rnd() * 50));
            add(pick(P.L!), tm(750 + rnd() * 55));
            if (rnd() < (P.s2 ?? 0)) add(pick(P.S!), tm(920 + rnd() * 50));
            add(pick(P.D!), tm(1135 + rnd() * 70));
            const we = wd === 5 || wd === 6;
            if (rnd() < (we ? (P.aWE ?? 0) : (P.aWD ?? 0)))
                add(pick(P.A!), tm(1265 + rnd() * 40));
            if (P.s3 && rnd() < P.s3)
                add(pick(P.S3 ?? P.S!), tm(1250 + rnd() * 40));
        }
        for (const { k, t } of day) {
            const p = C[k]!;
            const n = p.n;
            const kcal = p.items.length
                ? p.items.reduce((a, x) => a + x[2], 0)
                : (n.kcal ?? 0);
            const nr = (v: number | "nr" | undefined) =>
                v === "nr" || v == null ? null : v;
            const mid = `m-${++id}`;
            const hh = Number(t.slice(0, 2));
            const slot =
                p.type === "Drink"
                    ? "snack"
                    : hh < 10
                      ? "breakfast"
                      : hh < 12
                        ? "snack"
                        : hh < 15
                          ? "lunch"
                          : hh < 18
                            ? "snack"
                            : hh < 21
                              ? "dinner"
                              : "snack";
            meals.push({
                id: mid,
                user_id: "u",
                logged_at: `${iso}T${t}:00.000Z`,
                meal_type: slot,
                description: p.name,
                calories: kcal,
                protein_g: n.p,
                carbs_g: n.c,
                fat_g: n.f,
                fiber_g: n.fib,
                sugar_g: n.sug,
                added_sugar_g: nr(n.add),
                saturated_fat_g: nr(n.sat),
                trans_fat_g: nr(n.tr),
                sodium_mg: nr(n.na),
                caffeine_mg: P.noCaf ? (n.caf ? 0 : null) : (n.caf ?? null),
                alcohol_g: n.alc ?? (k === "IPA" || k === "WINE" ? 0 : null),
                notes: null,
                idempotency_key: null,
                saved_meal_id: null,
            });
            if (p.items.length)
                items.set(
                    mid,
                    p.items.map(([name, amount, k2], position) => {
                        const m = /^([\d.]+)\s*(.*)$/.exec(amount);
                        return {
                            position,
                            name,
                            amount: m ? Number(m[1]) : null,
                            unit: m ? m[2] || null : amount,
                            calories: k2,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                            fiber_g: null,
                            sugar_g: null,
                            added_sugar_g: null,
                            alcohol_g: null,
                            caffeine_mg: null,
                        } as MealItemValues;
                    }),
                );
        }
        const wl =
            P.wov?.[i] != null
                ? P.wov[i]!
                : logged && (P.wr == null || rnd() < P.wr) && P.wm
                  ? Math.max(
                        0.5,
                        Math.round(
                            (P.wm + (rnd() - 0.5) * 2 * (P.wv ?? 0)) * 20,
                        ) / 20,
                    )
                  : 0;
        if (wl > 0) {
            const n = Math.max(2, Math.round(wl / 0.4));
            for (let j = 0; j < n; j++)
                water.push({
                    id: `w-${i}-${j}`,
                    user_id: "u",
                    amount_ml: Math.round((wl / n) * 1000),
                    logged_at: `${iso}T${tm(480 + j * (780 / n))}:00.000Z`,
                    notes: null,
                    created_at: "",
                    idempotency_key: null,
                });
        }
        let w: number | null = null;
        if (P.wOnly) w = P.wOnly.find((x) => x[0] === i)?.[1] ?? null;
        else if (rnd() < P.wp || i === 0 || (i === 1 && P.wp > 0.5))
            w =
                Math.round(
                    (P.w0 +
                        ((P.w1 - P.w0) * (60 - i)) / 60 +
                        (rnd() - 0.5) * 0.5) *
                        10,
                ) / 10;
        if (scenario === "typical" && i === 1) w = null;
        if (w != null)
            weights.push({
                id: `kg-${i}`,
                user_id: "u",
                weight_g: Math.round(w * 1000),
                logged_at: `${iso}T07:30:00.000Z`,
                notes: null,
                created_at: "",
                idempotency_key: null,
            });
    }
    return { meals, water, weights, items };
}

const GOALS: NutritionGoals = {
    user_id: "u",
    daily_calories: 2200,
    daily_protein_g: 160,
    daily_carbs_g: 260,
    daily_fat_g: 75,
    daily_fiber_g: 30,
    daily_sugar_g: 45,
    daily_added_sugar_g: 25,
    daily_saturated_fat_g: 20,
    daily_sodium_mg: 2300,
    daily_caffeine_mg: 400,
    daily_alcohol_g: 20,
    daily_water_ml: 2500,
    target_weight_g: 76_000,
    updated_at: "",
};

export function digestFixture(params: URLSearchParams) {
    const want = params.get("period") ?? "yesterday";
    const period: DigestPeriod = (DIGEST_PERIODS as readonly string[]).includes(
        want,
    )
        ? (want as DigestPeriod)
        : "yesterday";
    const scenario = params.get("scenario") ?? "typical";
    const data = build(
        scenario === "nogoals" || scenario === "nosodium"
            ? "typical"
            : scenario,
    );
    const du = params.get("drinkUnit");
    const goals =
        scenario === "nogoals"
            ? null
            : scenario === "nosodium"
              ? { ...GOALS, daily_sodium_mg: null }
              : GOALS;
    const latest =
        [...data.weights].sort((a, b) =>
            b.logged_at.localeCompare(a.logged_at),
        )[0] ?? null;
    const r = computeDigest({
        period,
        now: NOW,
        tz: "UTC",
        meals:
            scenario === "nosodium"
                ? data.meals.map((m) => ({ ...m, sodium_mg: null }))
                : data.meals,
        water: data.water,
        weights: data.weights,
        latestWeight: latest,
        items: data.items,
        goals,
        alcohol: du === "us" || du === "uk" ? du : null,
        weightUnit: params.get("unit") === "lb" ? "lb" : "kg",
        locale: "en",
    });
    return { result: r.structured, meta: { [DIGEST_META_KEY]: r.meta } };
}
