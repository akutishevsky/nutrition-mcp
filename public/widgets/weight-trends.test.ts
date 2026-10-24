// Tests for the weight-trends widget's own copy and for its intake of
// untrusted `_meta`.
//
// The template's JS has no import surface, so its intake functions are cut
// out of the source text and evaluated with the constants they read, the way
// macros.test.ts evaluates shared/macros.js.
import { describe, expect, test } from "bun:test";
import { LOCALES, SITE_LOCALES } from "../../src/routes";
import { WIDGET_STRINGS } from "../../src/copy/widgets";
import { RATE_DENSITY_DAYS, RATE_MIN_WEIGHINS } from "../../src/weight-trend";

const TEMPLATE = await Bun.file(
    "./public/widgets/src/templates/weight-trends.html",
).text();

describe("weight-trends copy", () => {
    // The widget restates the server's weekly-rate rule (src/weight-trend.ts)
    // in every locale; changing the rule must fail here until the text says so.
    test("hintNoRate restates the weekly-rate rule in every locale", () => {
        expect(RATE_DENSITY_DAYS % 7).toBe(0);
        for (const loc of SITE_LOCALES) {
            const s = WIDGET_STRINGS[loc]!.weightTrends.hintNoRate;
            expect(s).toContain(String(RATE_MIN_WEIGHINS));
            expect(s).toContain(String(RATE_DENSITY_DAYS / 7));
        }
    });

    // The redesign first shipped its new keys in English everywhere; the
    // landing page renders this widget per locale, so a pending key is an
    // English card on /de, /ja, …
    test("no weightTrends string is left untranslated", async () => {
        for (const loc of LOCALES) {
            const src = await Bun.file(`./src/copy/widgets.${loc}.ts`).text();
            const block = src.match(
                /^ {4}weightTrends: \{\n[\s\S]*?^ {4}\},\n/m,
            )![0];
            expect(block).not.toContain("i18n:pending");
            const t = WIDGET_STRINGS[loc]!.weightTrends;
            const en = WIDGET_STRINGS.en!.weightTrends;
            // Sentences that cannot legitimately match English.
            for (const k of [
                "titleFew",
                "titleNoRate",
                "hintFew",
                "showMore",
                "noMeasurements",
            ] as const)
                expect(t[k]).not.toBe(en[k]);
        }
    });
});

// ---- Intake of untrusted `_meta` ----
function cut(from: string, to: string): string {
    const a = TEMPLATE.indexOf(from);
    const b = TEMPLATE.indexOf(to, a);
    if (a < 0 || b < 0) throw new Error(`markers not found: ${from} / ${to}`);
    return TEMPLATE.slice(a, b);
}
const consts = cut("const SERIES_KEY", "// How many week groups");
const helpers = cut("const isNum =", "const dayNum =");
const intake = cut("function rowsOf(", "// ---- The model:");
const api = new Function(
    `${consts}\n${helpers}\n${intake}\nreturn { seriesFrom, entriesFrom, measFrom, SERIES_KEY, ENTRIES_KEY, MEAS_KEY };`,
)() as {
    seriesFrom: (m: unknown) => any;
    entriesFrom: (m: unknown) => any;
    measFrom: (m: unknown) => any;
    SERIES_KEY: string;
    ENTRIES_KEY: string;
    MEAS_KEY: string;
};

describe("weight-trends intake", () => {
    const junk = [undefined, null, 0, "x", [], {}, { [api.SERIES_KEY]: 5 }];

    test("missing or malformed _meta yields null, never a throw", () => {
        for (const m of junk) {
            expect(api.seriesFrom(m)).toBeNull();
            expect(api.entriesFrom(m)).toBeNull();
            expect(api.measFrom(m)).toBeNull();
        }
        expect(
            api.seriesFrom({ [api.SERIES_KEY]: { daily: "nope", weekly: {} } }),
        ).toBeNull();
        expect(
            api.entriesFrom({ [api.ENTRIES_KEY]: { entries: "nope" } }),
        ).toBeNull();
        expect(api.measFrom({ [api.MEAS_KEY]: { sites: 3 } })).toBeNull();
    });

    test("series rows are validated and sorted; bad scalars become null", () => {
        const s = api.seriesFrom({
            [api.SERIES_KEY]: {
                daily: [
                    { date: "2026-10-02", weight: 80, trend: 80.1 },
                    { date: "2026-10-01", weight: 81, trend: 80.5 },
                    { date: "2026-10-03", weight: "80", trend: 80 },
                    { date: "10/04/2026", weight: 79, trend: 79 },
                    null,
                ],
                daily_year: [{ date: "2026-01-01", weight: NaN, trend: 1 }],
                monthly: [{ month: "2026-1", weight: 1, trend: 1 }],
                first: { date: "2026-10-01", weight: "81" },
                trend_date: "yesterday",
                weekly_rate: Infinity,
            },
        });
        expect(s.daily.map((d: { date: string }) => d.date)).toEqual([
            "2026-10-01",
            "2026-10-02",
        ]);
        expect(s.year).toEqual([]);
        expect(s.monthly).toEqual([]);
        expect(s.first).toBeNull();
        expect(s.trendDate).toBeNull();
        expect(s.weeklyRate).toBeNull();
    });

    test("entries drop bad rows, clip notes and group by day in time order", () => {
        const e = api.entriesFrom({
            [api.ENTRIES_KEY]: {
                today: "2026-10-03",
                entries: [
                    { date: "2026-10-02", time: "21:10", weight: 80.2 },
                    {
                        date: "2026-10-02",
                        time: "07:05",
                        weight: 79.6,
                        note: "  " + "n".repeat(400),
                    },
                    { date: "2026-10-02", time: "7:05", weight: 79 },
                    { date: "2026-10-02", time: "08:00", weight: "79" },
                    { date: "bad", time: "08:00", weight: 79 },
                    { date: "2026-10-01", time: "08:00", weight: 81, note: 7 },
                ],
            },
        });
        expect(e.today).toBe("2026-10-03");
        const d2 = e.byDate.get("2026-10-02");
        expect(d2.map((x: { t: string }) => x.t)).toEqual(["07:05", "21:10"]);
        expect(d2[0].note.length).toBe(300);
        expect(e.byDate.get("2026-10-01")[0].note).toBeNull();
        expect(e.byDate.size).toBe(2);
    });

    test("measurements keep known sites in cm/in with positive values only", () => {
        const m = api.measFrom({
            [api.MEAS_KEY]: {
                sites: {
                    waist: {
                        unit: "cm",
                        entries: [
                            { date: "2026-10-02", value: 80 },
                            { date: "2026-09-01", value: 82 },
                            { date: "2026-09-02", value: 0 },
                            { date: "2026-09-03", value: "81" },
                        ],
                    },
                    hips: {
                        unit: "mm",
                        entries: [{ date: "2026-10-02", value: 1 }],
                    },
                    neck: { unit: "in", entries: [] },
                    tail: {
                        unit: "cm",
                        entries: [{ date: "2026-10-02", value: 9 }],
                    },
                },
            },
        });
        expect(Object.keys(m.sites)).toEqual(["waist"]);
        expect(m.sites.waist.entries).toEqual([
            { date: "2026-09-01", v: 82 },
            { date: "2026-10-02", v: 80 },
        ]);
    });
});
