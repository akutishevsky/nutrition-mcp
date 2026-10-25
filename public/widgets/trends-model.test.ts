// Behaviour tests for the trends widget's day model: buildModel() (the
// untrusted `_meta` checks, today detection, which nutrients exist at all) and
// statOf() (the averaging rule, the 110% calorie band, the on-target and
// over-limit counts). The widget averages over the days that carry a value and
// leaves a still-running today out while a finished day exists; those rules
// are the figures a reader sees, so they are pinned here rather than only
// eyeballed in the harness.
//
// Same evaluation technique as summary-caption.test.ts: the real assembled
// widget script is run as one script, cut off before its first DOM wiring
// (`const rootEl = document.getElementById("root")`).
import { test, expect, describe } from "bun:test";

type Day = Record<string, unknown> & { date: string };
type Stat = {
    key: string;
    avg: number | null;
    rec: number[];
    full: number[];
    partEx: boolean;
    nr: boolean;
    over: boolean;
    onT: number;
    overN: number;
    limitLike: boolean;
};
type Model = {
    dates: string[];
    logged: boolean[];
    series: Record<string, (number | null)[] | null>;
    goals: Record<string, number | null>;
    endsToday: boolean;
    anyLogged: boolean;
};
type W = { n: number; dates: string[]; logged: boolean[]; endsToday: boolean };

async function freshTrendsWidget() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("trends");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const cut = script.indexOf(
        'const rootEl = document.getElementById("root")',
    );
    if (cut === -1) throw new Error("trends DOM wiring not found");
    const factory = new Function(
        `${script.slice(0, cut)}
         return { buildModel, statOf, windowOf, cardInner, deviceToday, DEF, STATE };`,
    );
    return factory() as {
        buildModel: (data: unknown, meta: unknown) => Model;
        statOf: (def: unknown, w: W) => Stat;
        windowOf: () => W;
        cardInner: () => { html: string };
        deviceToday: () => string;
        DEF: unknown[][];
        STATE: Record<string, unknown>;
    };
}

const widget = await freshTrendsWidget();
const { buildModel, statOf, windowOf, cardInner, deviceToday, DEF, STATE } =
    widget;

const LOCAL_TODAY = "nutrition-mcp.com/local-today";
const SODIUM = "nutrition-mcp.com/sodium";

// Consecutive ISO dates ending at `end`.
function datesTo(end: string, n: number): string[] {
    const t = Date.parse(end + "T12:00:00Z");
    return Array.from({ length: n }, (_, i) =>
        new Date(t - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    );
}
const meal = (date: string, calories: number, extra = {}): Day => ({
    date,
    calories,
    protein_g: calories / 20,
    carbs_g: calories / 10,
    fat_g: calories / 40,
    water_ml: 0,
    ...extra,
});
const empty = (date: string, extra = {}): Day => ({
    date,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    water_ml: 0,
    ...extra,
});

function load(
    days: Day[],
    meta: unknown = {},
    rest: Record<string, unknown> = {},
) {
    const model = buildModel({ days, goals: {}, ...rest }, meta);
    STATE.model = model;
    STATE.range = 30;
    STATE.metric = "calories";
    STATE.level = 0;
    STATE.sel = null;
    STATE.day = null;
    return model;
}
const def = (key: string) => DEF.find((d) => d[0] === key)!;
const stat = (key: string) => statOf(def(key), windowOf());

describe("untrusted _meta", () => {
    const d = datesTo("2026-10-10", 3);
    const days = d.map((x) => meal(x, 2000));
    const today = { [LOCAL_TODAY]: { v: 1, today: "2026-10-10" } };

    test("an absent or malformed sodium payload means sodium is not offered", () => {
        for (const bad of [
            undefined,
            null,
            "oops",
            { v: 2, goal: 2300, days: {} },
            { v: 1, goal: 2300, days: [] },
            { v: 1, goal: 2300 },
        ]) {
            const m = load(days, { ...today, [SODIUM]: bad });
            expect(m.series.sodium).toBeNull();
            expect(m.goals.sodium).toBeNull();
            STATE.level = 1;
            expect(cardInner().html).not.toContain('data-k="sodium"');
            expect(cardInner().html).not.toContain('data-key="sodium"');
        }
    });

    test("negative, non-finite and non-date entries read as not recorded", () => {
        const m = load(days, {
            ...today,
            [SODIUM]: {
                v: 1,
                goal: -5,
                days: {
                    [d[0]!]: -1,
                    [d[1]!]: Number.NaN,
                    [d[2]!]: 1200,
                    "not-a-date": 900,
                },
            },
        });
        expect(m.series.sodium).toEqual([null, null, 1200]);
        expect(m.goals.sodium).toBeNull();
    });

    test("a valid sodium payload is offered with its own limit", () => {
        load(days, {
            [SODIUM]: { v: 1, goal: 2300, days: { [d[0]!]: 2000 } },
        });
        expect(cardInner().html).toContain('data-act="metric" data-k="sodium"');
    });

    test("negative or NaN totals in structuredContent count as zero", () => {
        const m = load(
            [
                meal(d[0]!, 1800),
                { ...empty(d[1]!), calories: -50, protein_g: Number.NaN },
                meal(d[2]!, 2200),
            ],
            { [LOCAL_TODAY]: { v: 1, today: "2026-12-31" } },
        );
        expect(m.series.calories).toEqual([1800, null, 2200]);
        expect(stat("calories").avg).toBe(2000);
    });
});

describe("which day is today", () => {
    test("local-today in _meta decides, over the device date", () => {
        const d = datesTo("2026-10-10", 3);
        const days = d.map((x) => meal(x, 2000));
        expect(
            load(days, { [LOCAL_TODAY]: { v: 1, today: "2026-10-10" } })
                .endsToday,
        ).toBe(true);
        expect(
            load(days, { [LOCAL_TODAY]: { v: 1, today: "2026-10-11" } })
                .endsToday,
        ).toBe(false);
    });

    test("a missing or malformed local-today falls back to the device date", () => {
        const days = datesTo(deviceToday(), 3).map((x) => meal(x, 2000));
        for (const meta of [
            undefined,
            {},
            { [LOCAL_TODAY]: { v: 2, today: "1999-01-01" } },
            { [LOCAL_TODAY]: { v: 1, today: "yesterday" } },
        ]) {
            expect(load(days, meta).endsToday).toBe(true);
        }
    });
});

describe("averaging", () => {
    const d = datesTo("2026-10-10", 4);
    const ends = { [LOCAL_TODAY]: { v: 1, today: "2026-10-10" } };
    const past = { [LOCAL_TODAY]: { v: 1, today: "2026-11-01" } };

    test("a day with no meal is a gap, not a zero", () => {
        load(
            [meal(d[0]!, 1800), empty(d[1]!), meal(d[2]!, 2200), empty(d[3]!)],
            past,
        );
        const c = stat("calories");
        expect(c.rec).toEqual([1800, 2200]);
        expect(c.avg).toBe(2000);
    });

    test("a still-running today is drawn but left out of the average", () => {
        load(
            [
                meal(d[0]!, 2000),
                meal(d[1]!, 2400),
                meal(d[2]!, 1600),
                meal(d[3]!, 300),
            ],
            ends,
        );
        const c = stat("calories");
        expect(c.rec).toHaveLength(4);
        expect(c.full).toEqual([2000, 2400, 1600]);
        expect(c.avg).toBe(2000);
        expect(c.partEx).toBe(true);
    });

    test("the same last day counts once the window ends in the past", () => {
        load(
            [
                meal(d[0]!, 2000),
                meal(d[1]!, 2400),
                meal(d[2]!, 1600),
                meal(d[3]!, 400),
            ],
            past,
        );
        const c = stat("calories");
        expect(c.avg).toBe(1600);
        expect(c.partEx).toBe(false);
    });

    test("today alone still gives an average when nothing else exists", () => {
        load(
            [empty(d[0]!), empty(d[1]!), empty(d[2]!), meal(d[3]!, 900)],
            ends,
        );
        const c = stat("calories");
        expect(c.avg).toBe(900);
        expect(c.partEx).toBe(false);
    });

    test("a water-only day counts for water, not for calories", () => {
        const m = load(
            [
                meal(d[0]!, 2000, { water_ml: 1500 }),
                empty(d[1]!, { water_ml: 2500 }),
                empty(d[2]!),
                empty(d[3]!),
            ],
            past,
        );
        expect(m.logged).toEqual([true, true, false, false]);
        expect(stat("calories").rec).toEqual([2000]);
        expect(stat("water").rec).toEqual([1.5, 2.5]);
        expect(stat("water").avg).toBe(2);
    });
});

describe("goals and counts", () => {
    const d = datesTo("2026-10-10", 4);
    const past = { [LOCAL_TODAY]: { v: 1, today: "2026-11-01" } };

    test("calories: on target within ±10%, over only past 110%", () => {
        load(
            [2000, 2150, 2300, 1700].map((c, i) => meal(d[i]!, c)),
            past,
            { goals: { calories: 2000 } },
        );
        const c = stat("calories");
        expect(c.onT).toBe(2);
        expect(c.overN).toBe(2);
        expect(c.limitLike).toBe(false);
        expect(c.over).toBe(false); // avg 2037.5 is inside the band

        load(
            [2300, 2300, 2300, 2300].map((c, i) => meal(d[i]!, c)),
            past,
            { goals: { calories: 2000 } },
        );
        expect(stat("calories").over).toBe(true);
    });

    test("a limit counts days at or under it as on target", () => {
        load(
            d.map((x) => meal(x, 2000)),
            {
                ...past,
                [SODIUM]: {
                    v: 1,
                    goal: 2300,
                    days: { [d[0]!]: 2000, [d[1]!]: 2400, [d[2]!]: 2300 },
                },
            },
        );
        const s = stat("sodium");
        expect(s.limitLike).toBe(true);
        expect(s.rec).toEqual([2000, 2400, 2300]);
        expect(s.onT).toBe(2);
        expect(s.overN).toBe(1);
        expect(s.over).toBe(false);
    });

    test("no goal, no counts", () => {
        load(
            d.map((x) => meal(x, 2500)),
            past,
        );
        const c = stat("calories");
        expect(c.onT).toBe(0);
        expect(c.overN).toBe(0);
        expect(c.over).toBe(false);
    });
});

describe("which nutrients are offered", () => {
    const d = datesTo("2026-10-10", 3);
    const past = { [LOCAL_TODAY]: { v: 1, today: "2026-11-01" } };

    test("alcohol is hidden while tracking is off", () => {
        const m = load(
            d.map((x) => meal(x, 2000, { alcohol_g: 28 })),
            past,
            { drink_unit: null, goals: { alcohol_g: 14 } },
        );
        expect(m.series.alcohol).toBeNull();
        expect(m.goals.alcohol).toBeNull();
        STATE.level = 1;
        expect(cardInner().html).not.toContain('data-key="alcohol"');
    });

    test("alcohol is shown in the account's drink unit", () => {
        const m = load(
            d.map((x) => meal(x, 2000, { alcohol_g: 28 })),
            past,
            { drink_unit: "us", goals: { alcohol_g: 14 } },
        );
        expect(m.series.alcohol).toEqual([2, 2, 2]);
        expect(m.goals.alcohol).toBe(1);
        expect(stat("alcohol").overN).toBe(3);
    });

    test("trans fat, caffeine and alcohol never recorded are not offered; fiber still is", () => {
        load(
            d.map((x) => meal(x, 2000)),
            past,
            { drink_unit: "us" },
        );
        STATE.level = 1;
        const html = cardInner().html;
        expect(html).not.toContain('data-key="caffeine"');
        expect(html).not.toContain('data-key="alcohol"');
        expect(html).toContain('data-key="fiber"');
        // ...but a nutrient with nothing recorded is never a chip.
        expect(html).not.toContain('data-act="metric" data-k="fiber"');
        expect(html).toContain('data-act="metric" data-k="calories"');
    });
});

describe("chip strip arrows", () => {
    test("a hidden arrow is out of the tab order and the a11y tree", () => {
        const d = datesTo("2026-10-10", 3);
        load(d.map((x) => meal(x, 2000)));
        const tag = (side: string) => {
            const html = cardInner().html;
            const at = html.indexOf(`class="reset msa ${side}"`);
            return html.slice(
                html.lastIndexOf("<button", at),
                html.indexOf(">", at) + 1,
            );
        };
        STATE.swS = "start";
        expect(tag("l")).toContain('tabindex="-1" aria-hidden="true"');
        expect(tag("r")).not.toContain("tabindex");
        STATE.swS = "mid";
        expect(tag("l")).not.toContain("tabindex");
        expect(tag("r")).not.toContain("tabindex");
        STATE.swS = "none";
        expect(tag("l")).toContain('aria-hidden="true"');
        expect(tag("r")).toContain('aria-hidden="true"');
        STATE.swS = "start";
    });
});
