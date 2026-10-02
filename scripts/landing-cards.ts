/**
 * The landing page's demo widget cards and drawn photos, rendered as static
 * markup at generate time by scripts/gen-index.ts.
 *
 * Each card is the REAL widget, not a drawing of it: this file builds the
 * structuredContent the conversation's tool call would return for the demo
 * account, and scripts/widget-static.ts runs that widget's own render() on it
 * at build time and ships the markup and the widget's CSS in a declarative
 * shadow root (no iframe — the site sends `frame-ancestors 'none'`). So a
 * change to a widget reaches the landing page on the next generate.
 *
 * Every WORD on a card is the widget's own (WIDGET_STRINGS, picked by the
 * payload's `locale`), numbers format in the page's language, and every
 * NUMBER is defined here, once for all nine locales — the conversation copy
 * in src/copy/index.ts quotes them. The only text a card takes from the page
 * copy is the meal a meal-logged card names.
 *
 * Page-only: nothing outside gen-index.ts imports this.
 */

import { HTML_LANG, type SiteLocale } from "../src/routes.js";
import { loadWidgetSources, renderWidgetCard } from "./widget-static.js";

// ------------------------------------------------------------------ data

/** Daily goals every demo account shares (the "Set goals, check in" slide
 * sets exactly these). */
const GOALS = {
    kcal: 2000,
    pro: 160,
    car: 220,
    fat: 70,
    fib: 30,
    sug: 60,
    caf: 400,
    water: 2500,
} as const;

interface Totals {
    kcal: number;
    pro: number;
    car: number;
    fat: number;
    fib: number;
    sug: number;
    /** null: nothing with caffeine logged, so the limit row omits it. */
    caf: number | null;
    /** Grams of alcohol; set only on a drink logged with tracking on. */
    alc?: number;
    /** Millilitres. */
    water: number;
}

/** 14 days of the "Review the week" account, oldest first: date, kcal,
 * protein, carbs, fat, fiber, sugar, caffeine, water ml. 25 Feb was not
 * logged. The slide's reply quotes what get_trends({days: 14}) prints for
 * them: 13 of 14 days logged, a 10-day streak, 9 days within ±10% of the
 * 2,000 kcal target, 1,830 kcal as a calendar-day average (the unlogged day
 * counts as zero), sugar 52 g over the 13 days with data, over 60 g on 4. */
const TRENDS_DAYS: [
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
][] = [
    ["2026-02-22", 2030, 155, 210, 69, 28.2, 53, 165, 2300],
    ["2026-02-23", 1850, 143, 192, 63, 25.4, 45, 135, 2050],
    ["2026-02-24", 2190, 165, 230, 73, 30.7, 62, 185, 2550],
    ["2026-02-25", 0, 0, 0, 0, 0, 0, 0, 0],
    ["2026-02-26", 1900, 147, 198, 66, 26.1, 47, 145, 2100],
    ["2026-02-27", 2240, 168, 236, 75, 33.0, 65, 195, 2650],
    ["2026-02-28", 1830, 141, 188, 62, 24.6, 43, 115, 2000],
    ["2026-03-01", 2080, 158, 214, 72, 29.8, 58, 180, 2300],
    ["2026-03-02", 1890, 146, 198, 64, 26.0, 44, 150, 2100],
    ["2026-03-03", 2140, 162, 226, 71, 31.1, 61, 210, 2600],
    ["2026-03-04", 1760, 138, 182, 60, 24.6, 38, 120, 1800],
    ["2026-03-05", 2210, 170, 236, 74, 33.5, 66, 190, 2500],
    ["2026-03-06", 1650, 128, 172, 56, 23.1, 42, 140, 1900],
    ["2026-03-07", 1850, 148, 172, 79, 27.9, 55, 130, 2200],
];

/** Weigh-ins, [days before the last one, kg], oldest first: 80.2 kg on
 * 11 Feb down to 78.4 kg on 12 Mar (the "Track your weight" slide). */
const WEIGH_INS: [number, number][] = [
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
    [0, 78.4],
];
const TARGET_KG = 75;

export type DemoCardId =
    | "hero-meal"
    | "hero-day"
    | "hero-weight"
    | "log-meal"
    | "photo-meal"
    | "scan-barcode"
    | "goals-progress"
    | "review-week"
    | "weight-trend"
    | "track-drinks"
    | "import-file";

/** A meal-logged card's figures: the day's totals right after the log, which
 * on these demo days is the meal itself. */
const MEAL_CARDS: Partial<
    Record<
        DemoCardId,
        {
            date: string;
            /** log_meal's meal_type, which the widget prints in its header. */
            type: "breakfast" | "lunch" | "dinner" | "snack";
            totals: Totals;
            drink?: "uk";
        }
    >
> = {
    "hero-meal": {
        date: "2026-03-08",
        type: "breakfast",
        totals: {
            kcal: 480,
            pro: 21,
            car: 85,
            fat: 8,
            fib: 9,
            sug: 51,
            caf: 126,
            water: 0,
        },
    },
    "log-meal": {
        date: "2026-03-15",
        type: "breakfast",
        totals: {
            kcal: 320,
            pro: 11,
            car: 56,
            fat: 6,
            fib: 6,
            sug: 18,
            caf: 95,
            water: 0,
        },
    },
    "photo-meal": {
        date: "2026-03-16",
        type: "lunch",
        totals: {
            kcal: 520,
            pro: 24,
            car: 43,
            fat: 27,
            fib: 7,
            sug: 10,
            caf: null,
            water: 0,
        },
    },
    "scan-barcode": {
        date: "2026-03-17",
        type: "lunch",
        totals: {
            kcal: 139,
            pro: 0,
            car: 35,
            fat: 0,
            fib: 0,
            sug: 35,
            // Open Food Facts carries no caffeine: log_meal's typical 34 mg
            // per 355 ml cola, scaled to the 330 ml can.
            caf: 32,
            water: 0,
        },
    },
    "track-drinks": {
        date: "2026-03-19",
        type: "dinner",
        drink: "uk",
        totals: {
            kcal: 180,
            pro: 2,
            car: 12,
            fat: 0,
            fib: 0,
            sug: 0,
            caf: null,
            alc: 17.9,
            water: 0,
        },
    },
};

// ------------------------------------------------------------ payloads
//
// Each card is the structuredContent its tool would return for the demo
// account, rendered by the widget's own code (scripts/widget-static.ts). The
// shapes are the tools' outputSchemas (src/mcp.ts); every nullable field is
// present, as the server sends it.

const GOALS_ITEM = {
    calories: GOALS.kcal,
    protein_g: GOALS.pro,
    carbs_g: GOALS.car,
    fat_g: GOALS.fat,
    fiber_g: GOALS.fib,
    sugar_g: GOALS.sug,
    alcohol_g: null,
    caffeine_mg: GOALS.caf,
    water_ml: GOALS.water,
};

function totalsItem(t: Totals) {
    return {
        calories: t.kcal,
        protein_g: t.pro,
        carbs_g: t.car,
        fat_g: t.fat,
        fiber_g: t.fib,
        sugar_g: t.sug,
        alcohol_g: t.alc ?? null,
        caffeine_mg: t.caf,
        water_ml: t.water,
    };
}

/** A meal row (MEAL_BREAKDOWN_ITEM). Its description only appears in the
 * tile drawer, which a still card never opens. */
function mealRow(
    description: string,
    t: Totals,
    meal_type: string | null = null,
) {
    const { water_ml: _w, ...rest } = totalsItem(t);
    return { description, meal_type, date: null, ...rest };
}

const ZERO: Totals = {
    kcal: 0,
    pro: 0,
    car: 0,
    fat: 0,
    fib: 0,
    sug: 0,
    caf: null,
    water: 0,
};

/** The hero day (8 Mar): breakfast, lunch and the fries, 1,150 kcal and
 * 76 g protein — the reply quotes 850 kcal and 84 g left, sugar 59 of 60.
 * Keyed by meal_type; each row's description is the locale's hero copy
 * (`meal` on the exchange that logged it). */
const HERO_DAY_MEALS: [string, Totals][] = [
    ["breakfast", MEAL_CARDS["hero-meal"]!.totals],
    [
        "lunch",
        {
            kcal: 620,
            pro: 54,
            car: 57,
            fat: 19,
            fib: 5,
            sug: 8,
            caf: null,
            water: 0,
        },
    ],
    [
        "snack",
        {
            kcal: 50,
            pro: 1,
            car: 6,
            fat: 3,
            fib: 1,
            sug: 0,
            caf: null,
            water: 0,
        },
    ],
];

function sumTotals(rows: Totals[], water: number): Totals {
    const t = rows.reduce(
        (a, r) => ({
            kcal: a.kcal + r.kcal,
            pro: a.pro + r.pro,
            car: a.car + r.car,
            fat: a.fat + r.fat,
            fib: a.fib + r.fib,
            sug: a.sug + r.sug,
            caf:
                r.caf == null && a.caf == null
                    ? null
                    : (a.caf ?? 0) + (r.caf ?? 0),
            water: 0,
        }),
        ZERO,
    );
    return { ...t, water };
}

/** The "Set goals, check in" day (20 Feb): four meals, three glasses of
 * water, 1,540 kcal and 104 g protein, sugar 40 g, caffeine 130 mg. */
const GOALS_DAY_MEALS: Totals[] = [
    {
        kcal: 380,
        pro: 24,
        car: 48,
        fat: 10,
        fib: 6,
        sug: 14,
        caf: 95,
        water: 0,
    },
    {
        kcal: 560,
        pro: 42,
        car: 58,
        fat: 17,
        fib: 7,
        sug: 8,
        caf: null,
        water: 0,
    },
    { kcal: 180, pro: 12, car: 20, fat: 6, fib: 3, sug: 12, caf: 35, water: 0 },
    {
        kcal: 420,
        pro: 26,
        car: 46,
        fat: 15,
        fib: 4,
        sug: 6,
        caf: null,
        water: 0,
    },
];

function mealLoggedPayload(id: DemoCardId, meal: string, locale: string) {
    const d = MEAL_CARDS[id]!;
    const t = totalsItem(d.totals);
    const { water_ml: _w, ...logged } = t;
    return {
        action: "logged",
        date: d.date,
        drink_unit: d.drink ?? null,
        locale,
        // The widget prints the server's English meal_type enum ("lunch") in
        // its header verbatim, untranslated, so only the English page shows
        // it; translated pages leave it out rather than mix in English.
        logged_meal: {
            description: meal,
            meal_type: locale === "en" ? d.type : null,
            ...logged,
        },
        has_goals: true,
        goals: GOALS_ITEM,
        totals: t,
        meals: [mealRow(meal, d.totals)],
    };
}

type HeroMeal = { description: string; type: string };

function summaryPayload(locale: string, dayMeals: HeroMeal[]) {
    const date = "2026-03-08";
    if (
        dayMeals.length !== HERO_DAY_MEALS.length ||
        dayMeals.some((m, i) => m.type !== HERO_DAY_MEALS[i]![0])
    )
        throw new Error(
            `${locale}: hero chat must log ${HERO_DAY_MEALS.map(([t]) => t).join(", ")} in order, got ${dayMeals.map((m) => m.type).join(", ")}`,
        );
    const t = sumTotals(
        HERO_DAY_MEALS.map(([, m]) => m),
        500,
    );
    const day = { date, ...totalsItem(t), meal_count: HERO_DAY_MEALS.length };
    return {
        start_date: date,
        end_date: date,
        logged_days: 1,
        days_in_range: 1,
        drink_unit: null,
        locale,
        goals: GOALS_ITEM,
        averages: totalsItem(t),
        recorded_days: {
            fiber_g: 1,
            sugar_g: 1,
            alcohol_g: null,
            caffeine_mg: 1,
        },
        days: [day],
        meals: HERO_DAY_MEALS.map(([type, m], i) =>
            mealRow(dayMeals[i]!.description, m, type),
        ),
    };
}

function goalProgressPayload(locale: string) {
    const t = sumTotals(GOALS_DAY_MEALS, 1500);
    return {
        date: "2026-02-20",
        meal_count: GOALS_DAY_MEALS.length,
        water_entries: 3,
        drink_unit: null,
        locale,
        goals: GOALS_ITEM,
        totals: totalsItem(t),
        weight: {
            current: 79.6,
            target: TARGET_KG,
            unit: "kg",
            logged_on: "2026-02-20",
        },
        meals: GOALS_DAY_MEALS.map((m, i) => mealRow(`meal ${i + 1}`, m)),
    };
}

function trendsPayload(locale: string) {
    return {
        end_date: TRENDS_DAYS[TRENDS_DAYS.length - 1]![0],
        default_range: 14,
        drink_unit: null,
        locale,
        goals: GOALS_ITEM,
        days: TRENDS_DAYS.map(
            ([date, kcal, pro, car, fat, fib, sug, caf, water]) => ({
                date,
                calories: kcal,
                protein_g: pro,
                carbs_g: car,
                fat_g: fat,
                // An unlogged day recorded nothing: null, not a measured 0.
                fiber_g: kcal ? fib : null,
                sugar_g: kcal ? sug : null,
                alcohol_g: null,
                caffeine_mg: kcal ? caf : null,
                water_ml: water,
            }),
        ),
    };
}

/** Weigh-ins ending `endIso`. The hero's account is the same history scaled
 * to end at 78.8 kg on 8 Mar (−1.4 kg since 11 Feb); the slide's ends at
 * 78.4 kg on 12 Mar (−1.8 kg). */
function weightPayload(locale: string, hero: boolean) {
    const first = WEIGH_INS[0]![1];
    const last = WEIGH_INS[WEIGH_INS.length - 1]![1];
    const end = hero ? 78.8 : last;
    const span = WEIGH_INS[0]![0];
    const days = hero ? 25 : span;
    const start = Date.UTC(2026, 1, 11);
    const seen = new Set<string>();
    const out: { date: string; weight: number }[] = [];
    for (const [ago, kg] of WEIGH_INS) {
        const offset = Math.round(days - (ago * days) / span);
        const date = new Date(start + offset * 86_400_000)
            .toISOString()
            .slice(0, 10);
        if (seen.has(date)) continue;
        seen.add(date);
        const w = first - ((first - kg) * (first - end)) / (first - last);
        out.push({ date, weight: Math.round(w * 10) / 10 });
    }
    return {
        end_date: out[out.length - 1]!.date,
        unit: "kg",
        target: TARGET_KG,
        default_range: 30,
        locale,
        days: out,
    };
}

function importPayload(locale: string) {
    return {
        tz: "America/Chicago",
        today: "2026-03-20",
        max_rows_per_call: 50,
        import_tool_name: "bulk_import_meals",
        known_source_apps: [
            "myfitnesspal",
            "cronometer",
            "loseit",
            "macrofactor",
        ],
        widgets_enabled: true,
        // set_timezone ran just before start_meal_import, so the importer
        // opens in Chicago without the UTC note.
        tz_configured: true,
        drink_unit: null,
        locale,
    };
}

// --------------------------------------------------------------- cards

await loadWidgetSources();

/** One demo card, in the page's language: the real widget's markup for its
 * payload. `meal` is the meal a meal-logged card names and `dayMeals` the
 * meals the hero day's summary lists (both from the page copy); the other
 * cards ignore them. */
export function renderCard(
    id: DemoCardId,
    locale: SiteLocale,
    meal = "",
    dayMeals: HeroMeal[] = [],
): string {
    const lang = HTML_LANG[locale];
    const card = (key: string, payload: { locale: string }, today: string) =>
        renderWidgetCard(key, payload, { lang, today });
    switch (id) {
        case "hero-day":
            return card(
                "nutrition-summary",
                summaryPayload(locale, dayMeals),
                "2026-03-08",
            );
        case "hero-weight": {
            const p = weightPayload(locale, true);
            return card("weight-trends", p, p.end_date);
        }
        case "weight-trend": {
            const p = weightPayload(locale, false);
            return card("weight-trends", p, p.end_date);
        }
        case "goals-progress":
            return card(
                "goal-progress",
                goalProgressPayload(locale),
                "2026-02-20",
            );
        case "review-week":
            // Asked on the evening of the fortnight's last day (7 Mar is
            // logged), so get_trends' default end_date is today and the
            // window is exactly 22 Feb – 7 Mar.
            return card("trends", trendsPayload(locale), "2026-03-07");
        case "import-file":
            return card("import-meals", importPayload(locale), "2026-03-20");
        default: {
            const p = mealLoggedPayload(id, meal, locale);
            return card("meal-logged", p, p.date);
        }
    }
}

// --------------------------------------------------------------- photos

/** The hero's breakfast: a smoothie bowl and an americano. */
export function smoothieSvg(): string {
    const granola = [
        [74, 72],
        [82, 80],
        [90, 74],
        [78, 86],
        [88, 88],
        [96, 82],
    ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#b9853b"/>`)
        .join("");
    const banana = [
        [124, 56],
        [140, 64],
        [150, 80],
    ]
        .map(
            ([x, y]) =>
                `<circle cx="${x}" cy="${y}" r="10" fill="#f6e7b0"/><circle cx="${x}" cy="${y}" r="6" fill="#efd98c"/><circle cx="${x}" cy="${y}" r="1.6" fill="#b8a35a"/>`,
        )
        .join("");
    const berries = [
        [118, 108],
        [130, 112],
        [140, 104],
        [124, 98],
        [148, 96],
        [112, 118],
    ]
        .map(
            ([x, y], i) =>
                `<circle cx="${x}" cy="${y}" r="5.5" fill="${i % 2 ? "#3d3a8c" : "#c8243a"}"/>`,
        )
        .join("");
    return `<svg viewBox="0 0 300 170" width="100%" height="170" aria-hidden="true" focusable="false"><rect width="300" height="170" fill="#e9e1d3"/><path d="M0 58h300M0 116h300" stroke="#ddd3c2" stroke-width="2"/><ellipse cx="122" cy="92" rx="76" ry="70" fill="#000" opacity=".12"/><circle cx="118" cy="86" r="70" fill="#fbfaf7"/><circle cx="118" cy="86" r="58" fill="#b44a7a"/><circle cx="106" cy="74" r="36" fill="#c75d8c" opacity=".6"/><path d="M70 70c10-6 22-4 30 2l-6 22c-10 0-20-4-26-10z" fill="#d9a85b"/>${granola}${banana}${berries}<path d="M98 116c8 6 20 6 26 2" stroke="#e8b23a" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="238" cy="92" r="40" fill="#000" opacity=".12"/><circle cx="234" cy="86" r="38" fill="#fbfaf7"/><circle cx="234" cy="86" r="30" fill="#3b2215"/><ellipse cx="226" cy="80" rx="12" ry="7" fill="#6b4126" opacity=".7"/><path d="M270 78c12 0 12 16 0 16" stroke="#fbfaf7" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
}

/** The "Snap your plate" lunch: borscht with sour cream and dill, rye bread
 * and a spoon. */
export function borschtSvg(): string {
    const dill = [
        [-26, -10],
        [-18, 14],
        [8, -22],
        [22, 8],
        [-4, 24],
        [14, -6],
        [-30, 6],
        [2, -4],
    ]
        .map(
            ([dx, dy]) =>
                `<path d="M${124 + dx!} ${86 + dy!}l6 -3m-3 1.5l1 -5m-1 5l5 2" stroke="#3f7d2a" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
        )
        .join("");
    const seeds = [
        [220, 82],
        [244, 90],
        [230, 108],
        [252, 114],
        [224, 122],
        [240, 74],
    ]
        .map(
            ([x, y]) =>
                `<circle cx="${x}" cy="${y}" r="1.8" fill="#2a1a10" opacity=".6"/>`,
        )
        .join("");
    return `<svg viewBox="0 0 300 170" width="100%" height="170" aria-hidden="true" focusable="false"><rect width="300" height="170" fill="#6b4a34"/><path d="M0 40h300M0 92h300M0 140h300" stroke="#5c3e2b" stroke-width="2"/><ellipse cx="128" cy="92" rx="78" ry="72" fill="#000" opacity=".18"/><circle cx="124" cy="86" r="72" fill="#f4efe6"/><circle cx="124" cy="86" r="58" fill="#e8e0d2"/><circle cx="124" cy="86" r="50" fill="#8e1b2c"/><circle cx="116" cy="80" r="34" fill="#a3233a" opacity=".7"/><path d="M110 78c6-12 26-12 30 0c6 4 2 16-8 16c-6 6-22 4-24-4c-6-2-4-10 2-12z" fill="#fbf7ef"/><ellipse cx="120" cy="82" rx="8" ry="4" fill="#fff" opacity=".8"/>${dill}<g transform="rotate(-12 236 96)"><rect x="200" y="58" width="74" height="80" rx="22" fill="#3b2417"/><rect x="207" y="66" width="60" height="65" rx="17" fill="#7a5236"/>${seeds}</g><path d="M196 30l40 52" stroke="#c9ccd2" stroke-width="7" stroke-linecap="round"/><ellipse cx="190" cy="24" rx="10" ry="14" fill="#d7dade" transform="rotate(-38 190 24)"/></svg>`;
}

/** The "Scan a barcode" photo: the barcode label on a red can. */
export function canSvg(): string {
    const widths = [
        2, 1, 1, 2, 3, 1, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 1, 1, 3, 1, 1, 2, 1,
        1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 2,
    ];
    let x = 94;
    const bars = widths
        .map((w, i) => {
            const out =
                i % 2
                    ? ""
                    : `<rect x="${x.toFixed(1)}" y="64" width="${(w * 1.6).toFixed(1)}" height="58" fill="#111"/>`;
            x += w * 1.6 + 1.2;
            return out;
        })
        .join("");
    return `<svg viewBox="0 0 300 170" width="100%" height="170" aria-hidden="true" focusable="false"><defs><linearGradient id="lp-can-grad" x1="0" x2="1"><stop offset="0" stop-color="#8f0a12"/><stop offset=".35" stop-color="#e01b24"/><stop offset=".55" stop-color="#f04a50"/><stop offset="1" stop-color="#7d0a10"/></linearGradient></defs><rect width="300" height="170" fill="#d9dde3"/><rect x="30" y="-10" width="240" height="190" rx="18" fill="url(#lp-can-grad)"/><path d="M30 14c60 10 180 10 240 0" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/><path d="M30 150c60 10 180 10 240 0" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/><rect x="84" y="52" width="132" height="92" rx="6" fill="#fff"/>${bars}<text x="150" y="136" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" letter-spacing="1.5" fill="#111">5 449000 000996</text><text x="150" y="36" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="13" fill="#fff" opacity=".9">330 ml</text></svg>`;
}
