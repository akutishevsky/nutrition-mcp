// Behaviour tests for shared/date.js — the header date helpers every macro
// widget names its day or window with (ymd, dayLabel, rangeLabel,
// rangeLabelPlain, dayHeader, daysLoggedCaption, shiftDay) on top of the Intl
// formatter they share with shortDate().
//
// Same technique as macros.test.ts: the RAW partials are evaluated in the order
// a template includes them — i18n.js, then date.js — with a WIDGET_STRINGS
// object standing in for the dictionary the assembler splices in. The real
// locale dictionaries are wired in, because what is pinned below is exactly
// the locale-specific wording (uk/pl plural forms, the Japanese month order).
//
// Expectations on the Intl path are deliberately shape checks, not whole
// strings: ICU data moves between runtime versions ("5 – 7 Jul" vs "5–7 Jul"),
// and pinning its punctuation would fail on an upgrade that changed nothing of
// ours. The hand-rolled fallback (rangeLabelPlain) IS ours, so it is pinned
// byte for byte. Years are computed from the clock, because "is this the
// current year" is part of the rule under test.
import { test, expect } from "bun:test";
import { WIDGET_STRINGS_EN } from "../../src/copy/widgets";
import { WIDGET_STRINGS_UK } from "../../src/copy/widgets.uk";
import { WIDGET_STRINGS_PL } from "../../src/copy/widgets.pl";
import { WIDGET_STRINGS_JA } from "../../src/copy/widgets.ja";

const SRC = "./public/widgets/src";
const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
const dateSrc = await Bun.file(`${SRC}/shared/date.js`).text();

type DateApi = {
    setLocale: (locale: string) => unknown;
    ymd: (s: unknown) => { y: number; m: number; d: number } | null;
    dayLabel: (s: unknown, withYear?: boolean) => string;
    rangeLabel: (start: unknown, end: unknown) => string;
    rangeLabelPlain: (start: unknown, end: unknown) => string;
    dayHeader: (iso: unknown) => string;
    shortDate: (iso: unknown) => string;
    daysLoggedCaption: (logged: number, span?: unknown) => string;
    shiftDay: (iso: unknown, delta: unknown) => string | null;
};

// `intl` shadows the global Intl inside the evaluated partials, which is how
// the fallback test below takes Intl date formatting away without touching the
// real global the rest of the suite shares.
function load(intl: unknown = Intl): DateApi {
    const factory = new Function(
        "WIDGET_STRINGS",
        "Intl",
        `${i18nSrc}\n${dateSrc}\nreturn { setLocale, ymd, dayLabel, rangeLabel, rangeLabelPlain, dayHeader, shortDate, daysLoggedCaption, shiftDay };`,
    );
    return factory(
        {
            en: WIDGET_STRINGS_EN,
            uk: WIDGET_STRINGS_UK,
            pl: WIDGET_STRINGS_PL,
            ja: WIDGET_STRINGS_JA,
        },
        intl,
    ) as DateApi;
}

const d = load();
const Y = new Date().getFullYear();
const P = Y - 1;
const LETTER = /\p{L}/u;

// ---- ymd: the fix -----------------------------------------------------------

// The regression: ymd() used to check only that the month was 1..12, so
// "2026-02-31" parsed and the fallback header printed "31 Feb" — a date the
// payload never sent. It now rides on utcDay()'s round trip.
test("ymd rejects a day that does not exist, and a month that does not", () => {
    expect(d.ymd("2026-02-31")).toBeNull();
    expect(d.ymd("2026-13-01")).toBeNull();
    expect(d.ymd("2026-02-29")).toBeNull();
    expect(d.ymd("2026-7-5")).toBeNull();
    expect(d.ymd(null)).toBeNull();
    expect(d.ymd("2024-02-29")).toEqual({ y: 2024, m: 2, d: 29 });
    expect(d.ymd("2026-07-05")).toEqual({ y: 2026, m: 7, d: 5 });
});

test("an invalid date takes the raw passthrough, never a made-up day", () => {
    d.setLocale("en");
    for (const bad of ["2026-02-31", "2026-13-01"]) {
        expect(d.rangeLabel("2026-02-01", bad)).toBe(`2026-02-01 → ${bad}`);
        expect(d.rangeLabelPlain("2026-02-01", bad)).toBe(
            `2026-02-01 → ${bad}`,
        );
        expect(d.dayLabel(bad, true)).toBe(bad);
    }
    expect(d.rangeLabel("2026-02-01", "2026-02-31")).not.toContain("31 Feb");
});

// ---- rangeLabel through Intl ------------------------------------------------

test("same-month, cross-month and cross-year ranges (Intl path)", () => {
    d.setLocale("en");
    const same = d.rangeLabel(`${Y}-07-05`, `${Y}-07-07`);
    expect(same).toMatch(/^5\s*–\s*7 Jul$/);
    const cross = d.rangeLabel(`${Y}-06-28`, `${Y}-07-04`);
    expect(cross).toMatch(/^28 Jun\s*–\s*4 Jul$/);
    // Crossing a year is where the year is the whole point: both ends carry it.
    const yearly = d.rangeLabel(`${P}-12-28`, `${Y}-01-03`);
    expect(yearly).toContain(String(P));
    expect(yearly).toContain(String(Y));
    // A whole window in a past year names that year once, at the end.
    const past = d.rangeLabel(`${P}-07-01`, `${P}-07-07`);
    expect(past).toMatch(new RegExp(`^1\\s*–\\s*7 Jul ${P}$`));
});

// Chrome and Safari's formatRange answer "07/05～07/07" for ja and "05.07–07.07"
// for pl (JavaScriptCore, which is what runs this suite, does both) — a numeric
// form the same locale's single date never uses. The guard in intlDateRange
// must turn that back into two lettered dates.
test("ja and pl never get the numeric formatRange form", () => {
    d.setLocale("ja");
    const ja = d.rangeLabel(`${Y}-07-05`, `${Y}-07-07`);
    expect(ja).toMatch(/7月5日/);
    expect(ja).toMatch(/7日$/);
    expect(ja).not.toMatch(/\d\s*\/\s*\d/);
    d.setLocale("pl");
    const pl = d.rangeLabel(`${Y}-07-05`, `${Y}-07-07`);
    expect(pl).toMatch(LETTER);
    expect(pl).toMatch(/lip/);
    expect(pl).not.toMatch(/\d\.\d/);
    d.setLocale("en");
});

// ---- dayHeader --------------------------------------------------------------

test("dayHeader: this year bare, a past year with its year", () => {
    d.setLocale("en");
    expect(d.dayHeader(`${Y}-07-10`)).toBe("10 Jul");
    expect(d.dayHeader(`${P}-03-02`)).toBe(`2 Mar ${P}`);
});

// Not rangeLabel(x, x), which would print "x → x": a caller that falls back on
// an empty string relies on a non-date passing through exactly as shortDate
// passes it.
test("dayHeader falls back to shortDate's passthrough for a non-date", () => {
    d.setLocale("en");
    for (const bad of ["2026-02-31", "2026-13-01", "yesterday"]) {
        expect(d.dayHeader(bad)).toBe(bad);
        expect(d.dayHeader(bad)).toBe(d.shortDate(bad));
    }
    expect(d.dayHeader("")).toBe("");
    expect(d.dayHeader(null)).toBe("");
});

// ---- the hand-rolled fallback ------------------------------------------------

test("rangeLabelPlain pins the fallback wording", () => {
    d.setLocale("en");
    expect(d.rangeLabelPlain(`${Y}-07-05`, `${Y}-07-07`)).toBe("5–7 Jul");
    expect(d.rangeLabelPlain(`${Y}-06-28`, `${Y}-07-04`)).toBe(
        "28 Jun – 4 Jul",
    );
    expect(d.rangeLabelPlain(`${P}-12-28`, `${Y}-01-03`)).toBe(
        `28 Dec ${P} – 3 Jan ${Y}`,
    );
    expect(d.rangeLabelPlain(`${P}-07-01`, `${P}-07-07`)).toBe(`1–7 Jul ${P}`);
    expect(d.rangeLabelPlain(`${Y}-07-10`, `${Y}-07-10`)).toBe("10 Jul");
    expect(d.rangeLabelPlain(`${P}-03-02`, `${P}-03-02`)).toBe(`2 Mar ${P}`);
    // Japanese factors the shared month out once and puts a year FIRST.
    d.setLocale("ja");
    expect(d.rangeLabelPlain(`${Y}-07-05`, `${Y}-07-07`)).toBe("7月5日〜7日");
    expect(d.rangeLabelPlain(`${P}-07-05`, `${P}-07-07`)).toBe(
        `${P}年7月5日〜7日`,
    );
    expect(d.rangeLabelPlain(`${P}-12-28`, `${Y}-01-03`)).toBe(
        `${P}年12月28日 – ${Y}年1月3日`,
    );
    expect(d.rangeLabelPlain(`${P}-03-02`, `${P}-03-02`)).toBe(`${P}年3月2日`);
    expect(d.rangeLabelPlain(`${P}-06-28`, `${P}-07-04`)).toBe(
        `${P}年6月28日 – 7月4日`,
    );
    d.setLocale("en");
});

// With Intl date formatting gone (PluralRules kept — plural() needs it),
// rangeLabel must land on exactly the fallback, and dayHeader with it.
test("rangeLabel falls back to rangeLabelPlain when Intl fails", () => {
    const broken = load({
        PluralRules: Intl.PluralRules,
        DateTimeFormat: function () {
            throw new Error("no Intl dates here");
        },
    });
    broken.setLocale("en");
    const pairs: [string, string][] = [
        [`${Y}-07-05`, `${Y}-07-07`],
        [`${Y}-06-28`, `${Y}-07-04`],
        [`${P}-12-28`, `${Y}-01-03`],
        [`${P}-03-02`, `${P}-03-02`],
    ];
    for (const [a, b] of pairs)
        expect(broken.rangeLabel(a, b)).toBe(broken.rangeLabelPlain(a, b));
    expect(broken.dayHeader(`${P}-03-02`)).toBe(`2 Mar ${P}`);
    expect(broken.dayHeader(`${Y}-07-10`)).toBe("10 Jul");
});

// ---- daysLoggedCaption -------------------------------------------------------

test("daysLoggedCaption: a wider span names both numbers", () => {
    d.setLocale("en");
    expect(d.daysLoggedCaption(15, 30)).toBe("15 of 30 days logged");
    expect(d.daysLoggedCaption(30, 30)).toBe("30 days logged");
    expect(d.daysLoggedCaption(1)).toBe("1 day logged");
    // Anything that is not a usable, wider span falls back to the plain form.
    for (const span of [undefined, null, "oops", NaN, 3])
        expect(d.daysLoggedCaption(7, span)).toBe("7 days logged");
    expect(d.daysLoggedCaption(7, "30")).toBe("7 of 30 days logged");
});

// uk and pl have "few" and "many": 2–4 / 22–24 are few, 5–20 and 11–14 many.
test("daysLoggedCaption picks uk and pl few/many forms", () => {
    d.setLocale("uk");
    expect(d.daysLoggedCaption(1)).toBe("1 день з записом");
    expect(d.daysLoggedCaption(3)).toBe("3 дні з записами");
    expect(d.daysLoggedCaption(22)).toBe("22 дні з записами");
    expect(d.daysLoggedCaption(5)).toBe("5 днів з записами");
    expect(d.daysLoggedCaption(12)).toBe("12 днів з записами");
    expect(d.daysLoggedCaption(15, 30)).toBe("15 із 30 днів з записами");
    d.setLocale("pl");
    expect(d.daysLoggedCaption(1)).toBe("1 dzień z wpisem");
    expect(d.daysLoggedCaption(3)).toBe("3 dni z wpisami");
    expect(d.daysLoggedCaption(12)).toBe("12 dni z wpisami");
    expect(d.daysLoggedCaption(15, 30)).toBe("15 z 30 dni z wpisami");
    d.setLocale("en");
});

// ---- shiftDay ---------------------------------------------------------------

// Stepped in whole UTC days, so the zone the viewer sits in cannot matter; the
// test still runs inside one with a DST change (29 Mar / 25 Oct 2026 in Kyiv)
// so a regression to local-time arithmetic would land on the wrong day here.
test("shiftDay steps calendar days across DST, months and years", () => {
    const tz = process.env.TZ;
    process.env.TZ = "Europe/Kyiv";
    try {
        expect(d.shiftDay("2026-03-28", 1)).toBe("2026-03-29");
        expect(d.shiftDay("2026-03-28", 2)).toBe("2026-03-30");
        expect(d.shiftDay("2026-03-30", -2)).toBe("2026-03-28");
        expect(d.shiftDay("2026-10-26", -1)).toBe("2026-10-25");
        expect(d.shiftDay("2026-10-24", 2)).toBe("2026-10-26");
        expect(d.shiftDay("2026-01-01", -1)).toBe("2025-12-31");
        expect(d.shiftDay("2024-02-28", 1)).toBe("2024-02-29");
        expect(d.shiftDay("2026-07-15", -29)).toBe("2026-06-16");
        expect(d.shiftDay("2026-07-15", 0)).toBe("2026-07-15");
    } finally {
        if (tz === undefined) delete process.env.TZ;
        else process.env.TZ = tz;
    }
});

test("shiftDay returns null for an invalid date or delta", () => {
    expect(d.shiftDay("2026-02-31", 1)).toBeNull();
    expect(d.shiftDay("2026-13-01", -1)).toBeNull();
    expect(d.shiftDay("", 1)).toBeNull();
    expect(d.shiftDay("2026-07-15", NaN)).toBeNull();
    expect(d.shiftDay("2026-07-15", "x")).toBeNull();
});
