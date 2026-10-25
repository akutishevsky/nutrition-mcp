// plural() in shared/i18n.js: the Intl.PluralRules category a PluralForms
// value carries wins, else "other", then "one". Evaluated the way the
// assembler splices the partial into a page, with a stand-in WIDGET_STRINGS
// whose locales exercise every CLDR category.
import { describe, expect, test } from "bun:test";

const SRC = "./public/widgets/src";

const api = await (async () => {
    const i18nSrc = await Bun.file(`${SRC}/shared/i18n.js`).text();
    return new Function(
        "WIDGET_STRINGS",
        `${i18nSrc}\nreturn { setLocale, plural };`,
    )({ en: {}, pl: {}, uk: {}, ar: {}, cy: {} }) as {
        setLocale: (l: string) => void;
        plural: (
            forms: Record<string, string>,
            n: number,
            vars?: Record<string, unknown>,
        ) => string;
    };
})();

const ALL = {
    zero: "zero {n}",
    one: "one {n}",
    two: "two {n}",
    few: "few {n}",
    many: "many {n}",
    other: "other {n}",
};

describe("plural() picks the Intl.PluralRules category when present", () => {
    test("Polish: one, few, many", () => {
        api.setLocale("pl");
        expect(api.plural(ALL, 1)).toBe("one 1");
        expect(api.plural(ALL, 3)).toBe("few 3");
        expect(api.plural(ALL, 5)).toBe("many 5");
        expect(api.plural(ALL, 22)).toBe("few 22");
        expect(api.plural(ALL, 1.5)).toBe("other 1.5");
    });

    test("Ukrainian: one, few, many", () => {
        api.setLocale("uk");
        expect(api.plural(ALL, 21)).toBe("one 21");
        expect(api.plural(ALL, 4)).toBe("few 4");
        expect(api.plural(ALL, 11)).toBe("many 11");
    });

    test("Arabic and Welsh: zero and two", () => {
        api.setLocale("ar");
        expect(api.plural(ALL, 0)).toBe("zero 0");
        expect(api.plural(ALL, 2)).toBe("two 2");
        api.setLocale("cy");
        expect(api.plural(ALL, 2)).toBe("two 2");
    });
});

describe("plural() falls back to other, then one", () => {
    test("a missing category reads 'other'", () => {
        api.setLocale("pl");
        const forms = { one: "{n} posiłek", other: "{n} posiłków" };
        expect(api.plural(forms, 3)).toBe("3 posiłków");
        expect(api.plural(forms, 1)).toBe("1 posiłek");
    });

    test("without 'other' it reads 'one'", () => {
        api.setLocale("pl");
        expect(api.plural({ one: "{n} x" }, 5)).toBe("5 x");
    });

    test("English and extra placeholders", () => {
        api.setLocale("en");
        const forms = { one: "{n} meal at {t}", other: "{n} meals at {t}" };
        expect(api.plural(forms, 1, { t: "08:00" })).toBe("1 meal at 08:00");
        expect(api.plural(forms, 0, { t: "08:00" })).toBe("0 meals at 08:00");
    });
});
