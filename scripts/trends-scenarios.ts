// get_trends tool results for the widget harness (?trends=<scenario>), one per
// state the 2026-10 trends redesign draws: the design's seven scenarios
// (W3-Trends-M / -D) plus a no-goals one. Each is 30 days of one synthetic meal
// per logged day, so the `_meta` series come from the REAL builders the
// handler uses (buildAddedSugarMeta, buildSaturatedFatMeta, buildSodiumMeta).
//
// Dev-only, like the harness itself; nothing here is served by the app.

import { buildAddedSugarMeta } from "../src/added-sugar.js";
import { buildSaturatedFatMeta } from "../src/saturated-fat.js";
import { buildSodiumMeta } from "../src/sodium.js";
import type { Meal } from "../src/supabase.js";
import {
    ADDED_SUGAR_META_KEY,
    LOCAL_TODAY_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
} from "../src/widgets.js";

export const TRENDS_SCENARIOS = [
    "typical",
    "over",
    "long",
    "past",
    "sparse",
    "tiny",
    "empty",
    "nogoals",
] as const;
export type TrendsScenario = (typeof TRENDS_SCENARIOS)[number];

interface Opts {
    end: string;
    today: boolean;
    todayFrac?: number;
    skip?: number[];
    only?: number[];
    cal: number;
    calAmp?: number;
    p?: number;
    c?: number;
    f?: number;
    fib?: number | null;
    fibNr?: number[];
    sug?: number | null;
    add?: number | null;
    sat?: number | null;
    tr?: number | null;
    trAmp?: number;
    sod?: number | null;
    sodNr?: number[];
    sodAmp?: number;
    caf?: number | null;
    cafAmp?: number;
    alc?: number | null;
    alcAmp?: number;
    wat?: number;
    seed?: number;
}

const NOW = "2026-10-24";
const S: Record<
    TrendsScenario,
    { range: number; locale?: string; goals?: boolean; o: Opts }
> = {
    typical: {
        range: 14,
        o: {
            end: NOW,
            today: true,
            skip: [4, 11, 19],
            cal: 2060,
            p: 146,
            c: 214,
            f: 68,
            fib: 24,
            fibNr: [2, 9, 23],
            sug: 41,
            add: 17,
            sat: 17,
            tr: 0.4,
            sod: 2080,
            sodNr: [1, 8],
            caf: 190,
            alc: 12,
            wat: 2100,
            seed: 1,
        },
    },
    over: {
        range: 7,
        o: {
            end: NOW,
            today: true,
            todayFrac: 0.82,
            skip: [16],
            cal: 2560,
            calAmp: 300,
            p: 150,
            c: 272,
            f: 96,
            fib: 18,
            sug: 63,
            add: 34,
            sat: 27,
            tr: 0.8,
            sod: 3150,
            sodAmp: 520,
            caf: 380,
            cafAmp: 120,
            alc: 30,
            wat: 1650,
            seed: 3,
        },
    },
    long: {
        range: 30,
        locale: "de",
        o: {
            end: NOW,
            today: true,
            skip: [6, 13, 27],
            cal: 2120,
            p: 138,
            c: 226,
            f: 74,
            fib: 22,
            fibNr: [5],
            sug: 47,
            add: 21,
            sat: 21,
            tr: 0.3,
            sod: 2240,
            sodNr: [17],
            caf: 240,
            alc: 14,
            wat: 2300,
            seed: 5,
        },
    },
    past: {
        range: 14,
        o: {
            end: "2026-10-09",
            today: false,
            skip: [6],
            cal: 2180,
            p: 158,
            c: 210,
            f: 70,
            fib: 29,
            sug: 39,
            add: 14,
            sat: 18,
            tr: 0.2,
            sod: 1890,
            caf: 150,
            alc: null,
            wat: 2450,
            seed: 7,
        },
    },
    sparse: {
        range: 30,
        o: {
            end: NOW,
            today: true,
            todayFrac: 0.4,
            only: [0, 3, 9, 22],
            cal: 1780,
            p: 96,
            c: 190,
            f: 62,
            fib: 20,
            fibNr: [3, 9, 22],
            sug: 36,
            add: null,
            sat: null,
            tr: null,
            sod: 2450,
            sodNr: [9],
            caf: null,
            alc: null,
            wat: 900,
            seed: 9,
        },
    },
    tiny: {
        range: 7,
        o: {
            end: NOW,
            today: true,
            skip: [],
            cal: 2140,
            p: 152,
            c: 205,
            f: 66,
            fib: 31,
            sug: 9,
            add: 1.2,
            sat: 3,
            tr: 0.1,
            trAmp: 0.04,
            sod: 1450,
            sodAmp: 240,
            caf: 4,
            cafAmp: 3,
            alc: 1.4,
            alcAmp: 1,
            wat: 2600,
            seed: 11,
        },
    },
    empty: {
        range: 30,
        o: { end: NOW, today: true, only: [], cal: 0, wat: 0 },
    },
    nogoals: {
        range: 14,
        goals: false,
        o: {
            end: NOW,
            today: true,
            skip: [3, 10],
            cal: 1950,
            p: 120,
            c: 230,
            f: 64,
            fib: 21,
            sug: 44,
            add: 15,
            sat: 16,
            tr: null,
            sod: 2100,
            caf: 160,
            alc: null,
            wat: 1800,
            seed: 13,
        },
    },
};

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

const rnd = (i: number, k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
};
const r1 = (v: number) => Math.round(v * 10) / 10;

function shift(iso: string, n: number): string {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

export function trendsScenario(
    name: TrendsScenario,
    drinkUnit: "us" | "uk" | null,
): {
    result: Record<string, unknown>;
    meta: Record<string, unknown>;
} {
    const s = S[name];
    const o = s.o;
    const sd = o.seed ?? 1;
    const days: Record<string, unknown>[] = [];
    const byDate: Record<string, Meal[]> = {};
    for (let i = 29; i >= 0; i--) {
        const date = shift(o.end, -i);
        const skip =
            (o.skip ?? []).includes(i) ||
            (o.only != null && !o.only.includes(i));
        const w = Math.sin(i / 2.2 + sd) * 0.55 + (rnd(i, sd) - 0.5) * 0.9;
        const fr = o.today && i === 0 ? (o.todayFrac ?? 0.64) : 1;
        const v = (base: number, amp: number, k: number) =>
            Math.max(0, (base + amp * (w + (rnd(i, k + sd) - 0.5) * 0.6)) * fr);
        byDate[date] = [];
        if (skip) {
            days.push({
                date,
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
                water_ml: 0,
            });
            continue;
        }
        const fibNr = (o.fibNr ?? []).includes(i);
        const fib = o.fib == null || fibNr ? null : r1(v(o.fib, 7, 6));
        const sug = o.sug == null || fibNr ? null : r1(v(o.sug, 13, 7));
        const add =
            o.add == null || sug == null
                ? null
                : r1(Math.min(v(o.add, 8, 8), sug));
        const sat = o.sat == null ? null : r1(v(o.sat, 5, 9));
        const tr =
            o.tr == null
                ? null
                : r1(Math.max(v(o.tr, o.trAmp ?? 0.25, 10), 0.1));
        const sod =
            o.sod == null || (o.sodNr ?? []).includes(i)
                ? null
                : Math.round(v(o.sod, o.sodAmp ?? 380, 14));
        const caf =
            o.caf == null || i % 5 === 3
                ? null
                : Math.round(Math.max(v(o.caf, o.cafAmp ?? 70, 11), 1));
        const alc =
            o.alc == null || !drinkUnit
                ? null
                : i % 6 === 1
                  ? r1(v(o.alc, o.alcAmp ?? 6, 12))
                  : 0;
        const kcal = Math.round(v(o.cal, o.calAmp ?? 260, 2));
        const day = {
            date,
            calories: kcal,
            protein_g: Math.round(v(o.p ?? 145, 24, 3)),
            carbs_g: Math.round(v(o.c ?? 215, 34, 4)),
            fat_g: Math.round(v(o.f ?? 68, 11, 5)),
            fiber_g: fib,
            sugar_g: sug,
            alcohol_g: alc,
            caffeine_mg: caf,
            water_ml: Math.round(v(o.wat ?? 2100, 380, 13)),
        };
        days.push(day);
        byDate[date]!.push({
            id: `t${i}`,
            user_id: "harness",
            saved_meal_id: null,
            logged_at: `${date}T12:00:00Z`,
            meal_type: "lunch",
            description: "Day total",
            calories: kcal,
            protein_g: day.protein_g,
            carbs_g: day.carbs_g,
            fat_g: day.fat_g,
            saturated_fat_g: sat,
            trans_fat_g: tr,
            fiber_g: fib,
            sugar_g: sug,
            added_sugar_g: add,
            alcohol_g: alc,
            caffeine_mg: caf,
            sodium_mg: sod,
            notes: null,
            idempotency_key: null,
        } as Meal);
    }
    const goals = s.goals === false ? null : GOALS;
    return {
        result: {
            end_date: o.end,
            default_range: s.range,
            drink_unit: drinkUnit,
            locale: s.locale ?? "en",
            goals: goals
                ? { ...goals, alcohol_g: drinkUnit ? goals.alcohol_g : null }
                : null,
            days,
        },
        meta: {
            [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                goal: goals ? 25 : null,
                days: byDate,
            }),
            [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
                goal: goals ? 20 : null,
                days: byDate,
            }),
            [SODIUM_META_KEY]: buildSodiumMeta({
                goal: goals ? 2300 : null,
                days: byDate,
            }),
            [LOCAL_TODAY_META_KEY]: { v: 1, today: NOW },
        },
    };
}
