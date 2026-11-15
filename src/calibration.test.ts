import { describe, expect, test } from "bun:test";
import {
    buildCalibration,
    calibratedBaseline,
    DEFAULT_PARAMS,
    energyWindow,
    metabolismSeries,
    type EnergyDay,
} from "./calibration.js";
import {
    buildDashboardPayload,
    dashboardWindow,
    parseModelParams,
    whatIf,
} from "./dashboard.js";
import { foodTef } from "./body.js";
import { countDay, typicalDayKcal } from "./dashboard-stats.js";
import { buildScenario, previewInputs } from "./dashboard-fixture.js";

const iso = (n: number) =>
    new Date(Date.parse("2026-10-01T00:00:00Z") + n * 86_400_000)
        .toISOString()
        .slice(0, 10);

/** `len` days from Oct 1: 2000 eaten, 300 active, BMR 1700. */
function days(len: number, counted = (_i: number) => true): EnergyDay[] {
    return Array.from({ length: len }, (_, i) => ({
        date: iso(i),
        calories: 2000,
        active_kcal: 300,
        bmr_kcal: 1700,
        tef_kcal: 200,
        counted: counted(i),
    }));
}

/** A weigh-in every `step` days up to day `last`, on a straight line
 *  (gPerDay), with optional per-index noise. */
function weighIns(
    last: number,
    step: number,
    gPerDay: number,
    noise: number[] = [],
) {
    const out = [];
    for (let d = 0, k = 0; d <= last; d += step, k++)
        out.push({
            date: iso(d),
            weight_g: 80_000 + gPerDay * d + (noise[k] ?? 0),
        });
    return out;
}

describe("energyWindow", () => {
    test("TDEE = intake − slope × 6; baseline = TDEE − active − 10% TEF", () => {
        // −20 g/day: T = 2000 + 20 × 6 = 2120; baseline = 2120 − 300 − 200.
        const w = energyWindow(days(28), weighIns(21, 3, -20), iso(0), iso(27));
        expect(w.status).toBe("ok");
        expect(w.tdee_kcal).toBe(2120);
        expect(w.tef_kcal).toBe(200);
        expect(w.baseline_kcal).toBe(1620);
        // Positive: the formula (1700) runs 80 high.
        expect(w.offset_kcal).toBe(80);
        // The card's gap gives the same number: gap × 6 ÷ span.
        expect(Math.round((w.gap_g! * 6) / w.span_days!)).toBe(80);
        expect(w.uncertainty_kcal).toBe(0);
    });

    test("the trend damps one water-heavy weigh-in that endpoints would not", () => {
        const clean = energyWindow(
            days(28),
            weighIns(21, 3, -20),
            iso(0),
            iso(27),
        );
        const wet = energyWindow(
            days(28),
            weighIns(21, 3, -20, [0, 0, 0, 0, 0, 0, 0, 700]),
            iso(0),
            iso(27),
        );
        // Endpoints would move the offset by 700 × 6 ÷ 21 = 200 kcal/day.
        const moved = wet.offset_kcal! - clean.offset_kcal!;
        expect(moved).toBeGreaterThan(0);
        expect(moved).toBeLessThan(200);
        expect(wet.uncertainty_kcal!).toBeGreaterThan(0);
    });

    test("needs 21 days, 8 weigh-in days, 70% counted, and a quiet trend", () => {
        expect(
            energyWindow(days(28), weighIns(18, 2, 0), iso(0), iso(27)).status,
        ).toBe("too_few_days"); // 10 weigh-ins but an 18-day span
        expect(
            energyWindow(days(28), weighIns(21, 3, 0), iso(0), iso(27)).status,
        ).toBe("ok"); // days 0, 3, … 21: exactly 8
        expect(
            energyWindow(days(28), weighIns(21, 7, 0), iso(0), iso(27)).status,
        ).toBe("too_few_weighins"); // weekly: 4
        const sparse = days(28, (i) => i % 3 !== 0); // 67% counted
        expect(
            energyWindow(sparse, weighIns(21, 3, 0), iso(0), iso(27)).status,
        ).toBe("too_few_days");
        const noisy = weighIns(
            21,
            3,
            0,
            [0, 900, -900, 900, -900, 900, -900, 0],
        );
        expect(energyWindow(days(28), noisy, iso(0), iso(27)).status).toBe(
            "too_noisy",
        );
    });

    test("uncounted days are left out of the means", () => {
        const d = days(28).map((r, i) =>
            i % 5 === 0 ? { ...r, calories: 500, counted: false } : r,
        );
        const w = energyWindow(d, weighIns(21, 3, -20), iso(0), iso(27));
        expect(w.mean_intake_kcal).toBe(2000);
        expect(w.counted_days).toBe(16);
    });
});

describe("calibratedBaseline", () => {
    test("BMR − offset, held to ±25% with the limit flagged", () => {
        expect(calibratedBaseline(2000, 100)).toEqual({
            kcal: 1900,
            clamped: false,
        });
        expect(calibratedBaseline(2000, 900)).toEqual({
            kcal: 1500,
            clamped: true,
        });
        expect(calibratedBaseline(2000, -900)).toEqual({
            kcal: 2500,
            clamped: true,
        });
    });
});

describe("buildCalibration", () => {
    test("42 days ending yesterday; applied only on the calibrated basis", () => {
        const d = days(50);
        const w = weighIns(49, 3, -20);
        const today = iso(43);
        const formula = buildCalibration(d, w, today, "formula");
        const calibrated = buildCalibration(d, w, today, "calibrated");
        expect(formula.window.from).toBe(iso(1));
        expect(formula.window.to).toBe(iso(42));
        expect(formula.status).toBe("ok");
        expect(formula.applied).toBe(false);
        expect(calibrated.applied).toBe(true);
        expect(calibrated.resting_kcal).toBe(1620);
    });

    test("falls back to the formula BMR when the window does not qualify", () => {
        const c = buildCalibration(days(50), [], iso(43), "calibrated");
        expect(c.status).toBe("no_weighins");
        expect(c.applied).toBe(false);
        expect(c.resting_kcal).toBe(c.bmr_kcal);
    });
});

describe("metabolismSeries", () => {
    test("the last point is the calibration's baseline", () => {
        const d = days(60);
        const w = weighIns(59, 3, -20);
        const today = iso(59);
        const series = metabolismSeries(d, w, [iso(40), iso(50), today]);
        const c = buildCalibration(d, w, today, "calibrated");
        expect(series.at(-1)!.data_kcal).toBe(c.resting_kcal);
        expect(series.every((p) => p.formula_kcal === 1700)).toBe(true);
    });
});

describe("typicalDayKcal", () => {
    const r = (i: number, calories: number, mealCount = 3) => ({
        date: iso(i),
        calories,
        mealCount,
        in_progress: false,
    });
    test("median of logged days in the window, null under 7 days", () => {
        const rows = [1800, 2000, 1900, 300, 2100, 4000, 1950].map((k, i) =>
            r(i, k),
        );
        expect(typicalDayKcal(rows, iso(0), iso(6))).toBe(1950);
        expect(typicalDayKcal(rows.slice(0, 6), iso(0), iso(6))).toBeNull();
        // Days without meals are not "typical" days at 0 kcal.
        expect(typicalDayKcal([...rows, r(7, 0, 0)], iso(0), iso(7))).toBe(
            1950,
        );
    });
});

describe("countDay", () => {
    const row = {
        in_progress: false,
        mealCount: 3,
        active_kcal: 300 as number | null,
        calories: 1900,
    };
    test("automatic: 2+ entries and at least half a typical day", () => {
        expect(countDay(row, null, true, 2000)).toEqual({
            counted: true,
            reason: "auto_complete",
        });
        expect(
            countDay({ ...row, mealCount: 1 }, null, true, 2000).reason,
        ).toBe("auto_few_entries");
        expect(
            countDay({ ...row, calories: 999 }, null, true, 2000).reason,
        ).toBe("auto_low_kcal");
        expect(
            countDay({ ...row, calories: 1000 }, null, true, 2000).counted,
        ).toBe(true);
        // No typical day yet: only the entries test applies.
        expect(
            countDay({ ...row, calories: 300 }, null, true, null).counted,
        ).toBe(true);
    });
    test("a manual choice wins over the rule, both ways", () => {
        expect(
            countDay({ ...row, mealCount: 1 }, true, true, 2000).reason,
        ).toBe("manual_on");
        expect(countDay(row, false, true, 2000).reason).toBe("manual_off");
    });
    test("an unsynced watch day is excluded by default but can be forced either way", () => {
        const noSync = { ...row, active_kcal: null };
        expect(countDay(noSync, null, true, 2000).reason).toBe("no_watch");
        expect(countDay(noSync, true, true, 2000)).toEqual({
            counted: true,
            reason: "manual_on",
        });
        expect(countDay(noSync, false, true, 2000).reason).toBe("manual_off");
    });
    test("today and empty days never count, whatever the override", () => {
        expect(
            countDay({ ...row, in_progress: true }, true, true, 2000).reason,
        ).toBe("in_progress");
        expect(
            countDay({ ...row, mealCount: 0 }, true, true, 2000).reason,
        ).toBe("no_meals");
        // No watch at all: a null active is just "no activity data".
        expect(
            countDay({ ...row, active_kcal: null }, null, false, 2000).counted,
        ).toBe(true);
    });
});

describe("dashboard payload", () => {
    const TODAY = "2026-12-01";
    const fx = buildScenario("calibrate", TODAY);
    const at = (days: number, dayOverrides?: Record<string, boolean>) =>
        buildDashboardPayload({
            ...previewInputs(fx, days, TODAY),
            dayOverrides,
        });

    test("finds the fixture's 150 kcal/day offset through the noise", () => {
        const p = at(30);
        expect(p.calibration.status).toBe("ok");
        expect(
            Math.abs(p.calibration.implied_kcal_per_day! - 150),
        ).toBeLessThan(60);
    });

    test("Body figure, Estimate-vs-reality and the chart's last point agree", () => {
        const p = at(30);
        expect(p.estimateVsScale.implied_kcal_per_day).toBe(
            p.calibration.implied_kcal_per_day,
        );
        expect(p.metabolism.at(-1)!.data_kcal).toBe(p.calibration.resting_kcal);
        expect(p.metabolism).toHaveLength(30);
        expect(p.metabolism.every((m) => m.data_kcal != null)).toBe(true);
    });

    test("the figures do not depend on the chart range", () => {
        const a = at(7);
        const b = at(90);
        expect(a.calibration).toEqual(b.calibration);
        expect(a.estimateVsScale).toEqual(b.estimateVsScale);
        expect(a.metabolism).toEqual(b.metabolism.slice(-7));
    });

    test("a manual choice moves a day in or out of the calibration", () => {
        const base = at(30);
        const incomplete = base.daily.find(
            (r) =>
                r.count_reason === "auto_few_entries" &&
                r.date >= base.calibration.window.first_date! &&
                r.date < base.calibration.window.last_date!,
        )!;
        expect(incomplete).toBeDefined();
        const forced = at(30, { [incomplete.date]: true });
        expect(forced.calibration.counted_days).toBe(
            base.calibration.counted_days + 1,
        );
        expect(
            forced.daily.find((r) => r.date === incomplete.date)!.count_reason,
        ).toBe("manual_on");
    });

    test("default goal on calibrated days counts active kcal once", () => {
        const p = buildDashboardPayload(
            previewInputs({ ...fx, goals: null }, 30, TODAY),
        );
        expect(p.calibration.applied).toBe(true);
        const row = p.daily.find((r) => (r.active_kcal ?? 0) > 0)!;
        // Break-even: (baseline + active) ÷ (1 − the user's own digestion
        // share) — active counted once.
        const expected = Math.round(
            (row.bmr_kcal! + row.active_kcal!) / (1 - p.goalPlan.tef_share),
        );
        expect(Math.abs(row.goal_calories! - expected)).toBeLessThanOrEqual(1);
    });
});

describe("dashboardWindow", () => {
    test("fetches the 56 days the what-if lab can look back before the range's first day", () => {
        const w = dashboardWindow("2026-11-11", 7);
        expect(w.startDate).toBe("2026-11-05");
        expect(w.fetchStart).toBe("2026-09-10");
        expect(dashboardWindow("2026-11-11", 365).weightFetchStart).toBe(
            "2025-09-17",
        );
    });
});

describe("foodTef", () => {
    test("per macro, with the unexplained kcal at 10%", () => {
        // 150 g protein (600 kcal) × 25% + 200 g carbs (800) × 7.5% + 70 g
        // fat (630) × 2% + 0 kcal rest = 150 + 60 + 12.6.
        expect(
            foodTef({
                calories: 2030,
                protein_g: 150,
                carbs_g: 200,
                fat_g: 70,
            }),
        ).toBeCloseTo(222.6, 5);
        // A high-protein day burns more digesting than a high-fat one.
        const lean = foodTef({
            calories: 2000,
            protein_g: 250,
            carbs_g: 150,
            fat_g: 44,
        });
        const fatty = foodTef({
            calories: 2000,
            protein_g: 80,
            carbs_g: 150,
            fat_g: 120,
        });
        expect(lean).toBeGreaterThan(fatty);
    });
    test("falls back to 10% when macros explain under half the kcal", () => {
        expect(
            foodTef({
                calories: 1000,
                protein_g: 10,
                carbs_g: 10,
                fat_g: null,
            }),
        ).toBe(100);
        expect(
            foodTef({
                calories: 0,
                protein_g: null,
                carbs_g: null,
                fat_g: null,
            }),
        ).toBe(0);
    });
});

describe("what-if lab", () => {
    const TODAY = "2026-12-01";
    const fx = buildScenario("calibrate", TODAY);
    const inputs = previewInputs(fx, 30, TODAY);

    test("parses and bounds the parameters", () => {
        expect(parseModelParams({})).toEqual({
            windowDays: 42,
            kcalPerGram: 6,
            tefFraction: null,
        });
        expect(
            parseModelParams({ window: "28", k: "7.7", tef: "0.12" }),
        ).toEqual({ windowDays: 28, kcalPerGram: 7.7, tefFraction: 0.12 });
        for (const bad of [
            { window: "14" },
            { window: "57" },
            { window: "30.5" },
            { k: "4.9" },
            { k: "8" },
            { tef: "0.2" },
            { tef: "abc" },
        ])
            expect(parseModelParams(bad)).toBeNull();
    });

    test("default side is the dashboard's own calibration; custom differs", () => {
        const r = whatIf(inputs, {
            windowDays: 28,
            kcalPerGram: 7.7,
            tefFraction: 0.15,
        });
        expect(r.default.calibration).toEqual(
            buildDashboardPayload(inputs).calibration,
        );
        expect(r.custom.calibration.window_days).toBe(28);
        expect(r.custom.calibration.window.offset_kcal).not.toBe(
            r.default.calibration.window.offset_kcal,
        );
        // Default parameters reproduce the dashboard exactly.
        expect(whatIf(inputs, DEFAULT_PARAMS).custom.calibration).toEqual(
            r.default.calibration,
        );
    });
});

describe("break-even goal", () => {
    test("with no stored goal the goal is (resting + active) ÷ (1 − digestion share)", () => {
        const TODAY = "2026-12-01";
        const fx = buildScenario("offset", TODAY); // formula basis
        const p = buildDashboardPayload(
            previewInputs({ ...fx, goals: null }, 30, TODAY),
        );
        expect(p.calibration.applied).toBe(false);
        // The share is the user's own (their foods' per-macro digestion over
        // their intake), not a flat 10%.
        const f = p.goalPlan.tef_share;
        expect(f).toBeGreaterThan(0.05);
        expect(f).toBeLessThan(0.2);
        for (const r of p.daily.filter((r) => r.bmr_kcal != null))
            expect(r.goal_calories).toBe(
                Math.round((r.bmr_kcal! + (r.active_kcal ?? 0)) / (1 - f)),
            );
    });
});
