// The trends widget's period view (public/widgets/src/shared/period.js) and
// the strings it renders. period.js is plain widget JS with no DOM access in
// its parsing and string builders, so it is evaluated here with the few
// globals the assembled widget would give it (T, fmt, esc, tpl, plural,
// WIDGET_LOCALE). The assembler's own checks (src/widgets.test.ts) only prove
// it is inlined and parses; these run its logic.

import { describe, expect, test } from "bun:test";
import {
    WIDGET_STRINGS,
    WIDGET_STRINGS_EN,
    type WidgetStrings,
} from "./copy/widgets.js";
import { PERIOD_AVERAGES_META_KEY } from "./widgets.js";

const SOURCE = await Bun.file(
    new URL("../public/widgets/src/shared/period.js", import.meta.url),
).text();

interface PeriodApi {
    periodsFrom: (meta: unknown) => {
        periods: Record<string, { key: string }[]>;
        available: string[];
        groupBy: string;
        targetsFrom: string | null;
    } | null;
    periodRowFrom: (r: unknown) => unknown;
    periodMacroHtml: (
        cls: string,
        letter: string,
        value: number,
        target: number | null,
    ) => string;
    periodListHtml: (rows: unknown[], g: string, opts?: unknown) => string;
}

function load(strings: WidgetStrings): PeriodApi {
    const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
    const esc = (s: unknown) =>
        String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    const tpl = (s: string, vars: Record<string, unknown>) =>
        s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
    const plural = (forms: { other: string }) => forms.other;
    const factory = new Function(
        "T",
        "fmt",
        "esc",
        "tpl",
        "plural",
        "WIDGET_LOCALE",
        `${SOURCE}\nreturn { periodsFrom, periodRowFrom, periodMacroHtml, periodListHtml };`,
    ) as (...args: unknown[]) => PeriodApi;
    return factory(strings, fmt, esc, tpl, plural, "en");
}

const api = load(WIDGET_STRINGS_EN);

function row(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        key: "2026-07",
        start: "2026-07-01",
        end: "2026-07-31",
        days: 31,
        partial: false,
        logged_days: 2,
        avg: { calories: 1900, protein: 120, carbs: 200, fat: 60 },
        targets: { calories: 2000, protein: 130, carbs: null, fat: null },
        targets_changed: false,
        targets_assumed: false,
        on_target_days: 1,
        incomplete_days: 0,
        ...over,
    };
}

function meta(periods: Record<string, unknown>, groupBy = "month") {
    return {
        [PERIOD_AVERAGES_META_KEY]: {
            v: 1,
            end_date: "2026-07-31",
            group_by: groupBy,
            targets_from: null,
            periods,
        },
    };
}

describe("periodsFrom", () => {
    test("the widget reads the same _meta key the server writes", () => {
        expect(SOURCE).toContain(`"${PERIOD_AVERAGES_META_KEY}"`);
    });

    test("no _meta, or no usable row, is null (the day view, unchanged)", () => {
        expect(api.periodsFrom(undefined)).toBeNull();
        expect(api.periodsFrom({})).toBeNull();
        expect(api.periodsFrom(meta({ month: [] }))).toBeNull();
        expect(api.periodsFrom(meta({ month: "rows" }))).toBeNull();
    });

    test("malformed rows are dropped, never painted half-right", () => {
        const bad = [
            null,
            "row",
            row({ start: undefined }),
            row({ end: "July" }),
            row({ logged_days: "2" }),
            row({ logged_days: 40 }),
            row({ days: 0 }),
            row({ avg: null }),
            row({ avg: { calories: 1, protein: 1, carbs: "x", fat: 1 } }),
            row({ key: 7 }),
        ];
        for (const r of bad) expect(api.periodRowFrom(r)).toBeNull();
        const got = api.periodsFrom(
            meta({
                month: [
                    ...bad,
                    row(),
                    row({
                        key: "2026-06",
                        start: "2026-06-01",
                        end: "2026-06-30",
                        days: 30,
                    }),
                ],
            }),
        );
        expect(got?.periods.month?.map((r) => r.key)).toEqual([
            "2026-07",
            "2026-06",
        ]);
    });

    test("an empty period (no logged day) keeps a null average", () => {
        const r = api.periodRowFrom(row({ logged_days: 0, avg: null })) as {
            avg: unknown;
        };
        expect(r).not.toBeNull();
        expect(r.avg).toBeNull();
    });

    test("group_by falls back to the first available granularity", () => {
        const got = api.periodsFrom(
            meta({ week: [], quarter: [row()] }, "week"),
        );
        expect(got?.available).toEqual(["quarter"]);
        expect(got?.groupBy).toBe("quarter");
        const kept = api.periodsFrom(
            meta({ month: [row()], quarter: [row()] }),
        );
        expect(kept?.groupBy).toBe("month");
    });
});

describe("period rows render the locale's units", () => {
    test("macro figures use the localized gram unit", () => {
        const uk = WIDGET_STRINGS.uk!;
        expect(uk.macros.units.g).not.toBe("g");
        const html = load(uk).periodMacroHtml("pro", "Б", 148, 160);
        expect(html).toContain(`148/160 ${uk.macros.units.g}`);
        expect(api.periodMacroHtml("pro", "P", 148, null)).toContain("148 g");
    });

    test("a macro no logged day carried shows a dash, never 0", () => {
        const r = api.periodRowFrom(
            row({
                avg: { calories: 1950, protein: null, carbs: null, fat: 60 },
            }),
        );
        expect(r).not.toBeNull();
        const html = api.periodListHtml([r], "month");
        expect(html).toContain("–/130 g");
        expect(html).toContain("– g");
        expect(html).not.toContain(">0 g<");
        expect(html).toContain("60 g");
    });

    test("no macro target anywhere shows the no-targets line", () => {
        const html = api.periodListHtml(
            [api.periodRowFrom(row({ targets: null, on_target_days: null }))],
            "month",
        );
        expect(html).toContain(WIDGET_STRINGS_EN.trends.noTargets);
    });
});

describe("trends strings across locales", () => {
    const placeholders = (s: string) =>
        [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

    test("every locale keeps the English placeholders in every trends string", () => {
        const en = WIDGET_STRINGS_EN.trends as Record<string, unknown>;
        for (const [locale, strings] of Object.entries(WIDGET_STRINGS)) {
            const tr = strings!.trends as Record<string, unknown>;
            for (const [key, value] of Object.entries(en)) {
                const forms =
                    typeof value === "string"
                        ? { _: value }
                        : (value as Record<string, string>);
                const other =
                    typeof tr[key] === "string"
                        ? { _: tr[key] as string }
                        : (tr[key] as Record<string, string>);
                const want = placeholders(forms._ ?? forms.other ?? "");
                for (const form of Object.values(other)) {
                    expect({ locale, key, got: placeholders(form) }).toEqual({
                        locale,
                        key,
                        got: want,
                    });
                }
            }
        }
    });

    test("every locale's macros.ingredientCount keeps {n} in every form", () => {
        for (const [locale, strings] of Object.entries(WIDGET_STRINGS)) {
            const f = strings!.macros.ingredientCount;
            expect(f.one).toBeDefined();
            expect(f.other).toBeDefined();
            for (const form of Object.values(f)) {
                expect({ locale, got: placeholders(form!) }).toEqual({
                    locale,
                    got: ["n"],
                });
            }
        }
    });

    test("Polish and Ukrainian macros.ingredientCount carry distinct few and many forms", () => {
        for (const locale of ["pl", "uk"] as const) {
            const f = WIDGET_STRINGS[locale]!.macros.ingredientCount;
            expect(f.few).toBeDefined();
            expect(f.many).toBeDefined();
            expect(f.other).toBe(f.many!);
            expect(new Set([f.one, f.few, f.many]).size).toBe(3);
        }
    });

    test("Polish and Ukrainian possiblyIncomplete carry distinct few and many forms", () => {
        for (const locale of ["pl", "uk"] as const) {
            const f = WIDGET_STRINGS[locale]!.trends.possiblyIncomplete;
            expect(f.few).toBeDefined();
            expect(f.many).toBeDefined();
            expect(new Set([f.one, f.few, f.many]).size).toBe(3);
        }
    });
});
