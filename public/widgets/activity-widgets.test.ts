// Behaviour tests for active calories in the two widgets that draw them:
//
// - nutrition-summary: the line under the calorie gauge (activityRowText), the
//   untrusted `_meta` payload (activityPayload), and the sentence it builds
//   (activityText). With no activity the line is absent and the card is
//   unchanged.
// - trends: the Burned and Net nutrients (buildModel's `burned` and `net`
//   series, the activityByDay validator, and their offer rules in statOf).
//
// Same evaluation technique as trends-model.test.ts and summary-caption.test.ts:
// the real assembled widget script is run up to its DOM wiring, so these tests
// exercise the shipped functions rather than copies of them.
import { test, expect, describe } from "bun:test";
import { WIDGET_STRINGS_EN } from "../../src/copy/widgets";

const ACTIVITY = "nutrition-mcp.com/activity";

async function assembled(key: string, cut: string) {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml(key);
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const at = script.indexOf(cut);
    if (at === -1) throw new Error(`${key}: "${cut}" not found`);
    return script.slice(0, at);
}

async function freshSummary() {
    const head = await assembled("nutrition-summary", "initWidget({");
    const factory = new Function(
        `${head}
         return { activityPayload, activityRowText, activityText };`,
    );
    return factory() as {
        activityPayload: (raw: unknown) =>
            | {
                  date: string;
                  burned: number;
                  credited: number;
              }[]
            | null;
        activityRowText: (
            S: Record<string, string>,
            act: unknown,
            ctx: Record<string, unknown>,
        ) => string | null;
        activityText: (
            S: Record<string, string>,
            burned: number,
            credited: number,
            net: number | null,
        ) => string;
    };
}

async function freshTrends() {
    const head = await assembled(
        "trends",
        'const rootEl = document.getElementById("root")',
    );
    const factory = new Function(
        `${head}
         return { buildModel, statOf, windowOf, chartOf, DEF, STATE };`,
    );
    return factory() as {
        chartOf: (m: unknown, W: unknown, kind: string, sel: number) => string;
        buildModel: (
            data: Record<string, unknown>,
            meta: unknown,
        ) => {
            series: Record<string, (number | null)[] | null>;
            dates: string[];
        };
        statOf: (
            def: unknown,
            w: unknown,
        ) => { nr: boolean; avg: number | null };
        windowOf: () => unknown;
        DEF: unknown[][];
        STATE: Record<string, unknown>;
    };
}

const S = WIDGET_STRINGS_EN.nutritionSummary as unknown as Record<
    string,
    string
>;
const summary = await freshSummary();
const trends = await freshTrends();

describe("nutrition-summary activity line", () => {
    const day = "2026-10-24";

    test("a malformed payload is dropped and a usable one keeps its good days", () => {
        expect(summary.activityPayload(undefined)).toBeNull();
        expect(summary.activityPayload({ v: 2, days: [] })).toBeNull();
        expect(summary.activityPayload({ v: 1, days: "x" })).toBeNull();
        expect(
            summary.activityPayload({
                v: 1,
                days: [
                    { date: day, burned_kcal: 400, credited_kcal: 320 },
                    { date: "24/10/2026", burned_kcal: 1, credited_kcal: 1 },
                    { date: day, burned_kcal: -5, credited_kcal: 1 },
                    { date: day, burned_kcal: "400", credited_kcal: 1 },
                    { date: day, burned_kcal: 9, credited_kcal: Number.NaN },
                    null,
                ],
            }),
        ).toEqual([{ date: day, burned: 400, credited: 320 }]);
    });

    test("a day with a meal reads burned, credited and net", () => {
        const act = [{ date: day, burned: 400, credited: 320 }];
        const line = summary.activityRowText(S, act, {
            isRange: false,
            theDay: day,
            t: 2100,
            hasIntake: true,
        });
        expect(line).toBe("Burned 400 · credited 320 · net 1,780");
    });

    test("credited is left out when it equals burned, net when no meal was logged", () => {
        const act = [{ date: day, burned: 400, credited: 400 }];
        expect(
            summary.activityRowText(S, act, {
                isRange: false,
                theDay: day,
                t: 2100,
                hasIntake: true,
            }),
        ).toBe("Burned 400 · net 1,700");
        expect(
            summary.activityRowText(
                S,
                [{ date: day, burned: 400, credited: 320 }],
                {
                    isRange: false,
                    theDay: day,
                    t: 0,
                    hasIntake: false,
                },
            ),
        ).toBe("Burned 400 · credited 320");
    });

    test("no activity on the day, or no activity payload, means no line", () => {
        expect(
            summary.activityRowText(S, null, {
                isRange: false,
                theDay: day,
                t: 2100,
                hasIntake: true,
            }),
        ).toBeNull();
        expect(
            summary.activityRowText(
                S,
                [{ date: "2026-10-23", burned: 400, credited: 320 }],
                { isRange: false, theDay: day, t: 2100, hasIntake: true },
            ),
        ).toBeNull();
    });

    test("a range reads the daily average over its span, net from the average intake", () => {
        const act = [
            { date: "2026-10-20", burned: 400, credited: 320 },
            { date: "2026-10-22", burned: 600, credited: 600 },
        ];
        const line = summary.activityRowText(S, act, {
            isRange: true,
            start: "2026-10-20",
            end: "2026-10-26",
            span: 7,
            t: 2100,
            hasIntake: true,
        });
        // burned 1000 / 7, credited 920 / 7 (credited differs from burned).
        expect(line).toBe("avg/day: Burned 143 · credited 131 · net 1,969");
    });

    test("the sentence uses only the figures it is given", () => {
        expect(summary.activityText(S, 400, 400, null)).toBe("Burned 400");
    });
});

describe("trends Burned and Net", () => {
    const dates = Array.from({ length: 6 }, (_, i) => {
        const t = Date.parse("2026-10-10T12:00:00Z") - (5 - i) * 86_400_000;
        return new Date(t).toISOString().slice(0, 10);
    });
    const days = dates.map((date, i) => ({
        date,
        // Days 0 and 1 have no meal; the rest do.
        calories: i < 2 ? 0 : 2000,
        protein_g: i < 2 ? 0 : 100,
        carbs_g: i < 2 ? 0 : 200,
        fat_g: i < 2 ? 0 : 70,
        water_ml: 0,
    }));

    test("without the activity payload neither nutrient is offered", () => {
        const m = trends.buildModel({ days, goals: {} }, {});
        expect(m.series.burned).toBeNull();
        expect(m.series.net).toBeNull();
    });

    test("burned is set on activity days; net on every day with a meal", () => {
        const meta = {
            [ACTIVITY]: {
                v: 1,
                days: [
                    { date: dates[0], burned_kcal: 300, credited_kcal: 240 },
                    { date: dates[3], burned_kcal: 500, credited_kcal: 400 },
                    { date: "2001-01-01", burned_kcal: 9, credited_kcal: 9 },
                ],
            },
        };
        const m = trends.buildModel({ days, goals: {} }, meta);
        expect(m.series.burned).toEqual([300, null, null, 500, null, null]);
        // Days 0-1 have no meal, so no net; day 3 nets 2000 - 400, and a
        // meal day without activity nets its whole intake.
        expect(m.series.net).toEqual([null, null, 2000, 1600, 2000, 2000]);
    });

    test("net is averaged over meal days and read against the calorie goal", () => {
        const meta = {
            [ACTIVITY]: {
                v: 1,
                days: [
                    { date: dates[3], burned_kcal: 500, credited_kcal: 400 },
                    { date: dates[4], burned_kcal: 500, credited_kcal: 500 },
                ],
            },
        };
        trends.STATE.model = trends.buildModel(
            { days, goals: { calories: 2200 } },
            meta,
        );
        trends.STATE.range = 30;
        const net = trends.statOf(
            trends.DEF.find((d) => d[0] === "net"),
            { n: 6, dates, logged: days.map(() => true), endsToday: false },
        );
        expect(net.nr).toBe(false);
        expect(net.avg).toBe((2000 + 1600 + 1500 + 2000) / 4);
        expect(net.hasGoal).toBe(true);
        expect(net.g).toBe(2200);
        const burned = trends.statOf(
            trends.DEF.find((d) => d[0] === "burned"),
            { n: 6, dates, logged: days.map(() => true), endsToday: false },
        );
        expect(burned.avg).toBe(500);
        expect(burned.hasGoal).toBe(false);
    });

    test("net is flagged over the calorie goal like calories, with the same 10% band", () => {
        const meta = {
            [ACTIVITY]: {
                v: 1,
                days: [
                    { date: dates[3], burned_kcal: 500, credited_kcal: 400 },
                    { date: dates[4], burned_kcal: 500, credited_kcal: 500 },
                ],
            },
        };
        const W = {
            n: 6,
            dates,
            logged: days.map(() => true),
            endsToday: false,
        };
        const statFor = (goal: number) => {
            trends.STATE.model = trends.buildModel(
                { days, goals: { calories: goal } },
                meta,
            );
            trends.STATE.range = 30;
            return {
                net: trends.statOf(
                    trends.DEF.find((d) => d[0] === "net"),
                    W,
                ),
                calories: trends.statOf(
                    trends.DEF.find((d) => d[0] === "calories"),
                    W,
                ),
            };
        };
        // Net averages 1775 against a 1500 goal: over the 1650 band.
        const over = statFor(1500);
        expect(over.net.avg).toBe(1775);
        expect(over.net.over).toBe(true);
        expect(over.net.overN).toBe(3);
        expect(over.net.ceil).toBe(true);
        expect(over.net.limitLike).toBe(false);
        expect(over.net.over).toBe(over.calories.over);
        expect(over.net.limitLike).toBe(over.calories.limitLike);
        expect(over.net.ceil).toBe(over.calories.ceil);
        // Inside the 10% band (1775 <= 1650 * 1.1 = 1815): not flagged.
        expect(statFor(1650).net.over).toBe(false);
    });

    test("a malformed activity payload is dropped, not guessed at", () => {
        for (const bad of [
            { v: 2, days: [] },
            { v: 1, days: {} },
            {
                v: 1,
                days: [{ date: dates[0], burned_kcal: -1, credited_kcal: 0 }],
            },
        ]) {
            const m = trends.buildModel(
                { days, goals: {} },
                { [ACTIVITY]: bad },
            );
            expect(m.series.burned).toBeNull();
            expect(m.series.net).toBeNull();
        }
    });

    test("a negative net day draws no bar with a negative height", () => {
        // Net below zero (150 kcal eaten, 320 credited): the readout carries
        // the signed figure, the bar has no fill, and no inline height is
        // negative (a negative height is dropped, leaving a sliver).
        const net = {
            key: "net",
            label: "Net intake",
            u: "kcal",
            vals: [1200, -170, 900],
            hasGoal: false,
            g: 0,
            avg: 643,
            nr: false,
        };
        const W = {
            n: 3,
            endsToday: false,
            dates: dates.slice(0, 3),
            logged: [true, true, true],
        };
        const html = trends.chartOf(net, W, "nut", 1);
        expect(html).not.toMatch(/height:\s*-/);
        expect(html).toContain("cb sel neg");
        expect(html).toContain("-170");
        // Negative values never raise the chart's maximum: the 1200 day sets
        // it (1200 * 1.1), so it reads 90.9% and the 900 day 68.2%.
        expect(html).toContain("height: 90.9%");
        expect(html).toContain("height: 68.2%");
    });

    test("Burned and Net are in the nutrient list, after the existing ones", () => {
        const keys = trends.DEF.map((d) => d[0]);
        expect(keys.slice(-2)).toEqual(["burned", "net"]);
        expect(WIDGET_STRINGS_EN.trends.metricLabel.burned).toBe("Burned");
        expect(WIDGET_STRINGS_EN.trends.metricLabel.net).toBe("Net intake");
    });
});
