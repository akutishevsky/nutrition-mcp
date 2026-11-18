import { describe, expect, test } from "bun:test";
import type { PluralForms } from "./chrome.js";
import { diffCopy, mergeCopy, mergeLocaleCopy } from "./merge.js";
import {
    WIDGET_STRINGS,
    WIDGET_STRINGS_COMPACT,
    WIDGET_STRINGS_EN,
} from "./widgets.js";

describe("copy merge helpers", () => {
    test("mergeCopy merges nested objects by key and falls back to base", () => {
        const base = {
            title: "Hello",
            nested: { a: "one", b: "two" },
            list: ["x", "y"],
        };
        const merged = mergeCopy(base, {
            nested: { a: "eins" },
        });
        expect(merged).toEqual({
            title: "Hello",
            nested: { a: "eins", b: "two" },
            list: ["x", "y"],
        });
        expect(base.nested.a).toBe("one");
    });

    test("mergeCopy replaces PluralForms maps atomically", () => {
        const base: { items: PluralForms } = {
            items: { one: "{n} item", other: "{n} items" },
        };
        const merged = mergeCopy(base, {
            items: { other: "{n}件" },
        });
        expect(merged.items).toEqual({ other: "{n}件" });
        expect("one" in merged.items).toBe(false);
    });

    test("diffCopy strips identical keys and round-trips through mergeCopy", () => {
        const base = { a: "same", b: { x: "1", y: "2" }, c: ["k"] };
        const target = { a: "same", b: { x: "1", y: "zwei" }, c: ["k"] };
        const diff = diffCopy(base, target);
        expect(diff).toEqual({ b: { y: "zwei" } });
        expect(mergeCopy(base, diff)).toEqual(target);
    });

    test("mergeLocaleCopy returns English plus merged overlays", () => {
        const map = mergeLocaleCopy<
            "en" | "de" | "fr",
            { a: string; b: string }
        >({ a: "hello", b: "world" }, { de: { a: "hallo" }, fr: undefined });
        expect(map.en).toEqual({ a: "hello", b: "world" });
        expect(map.de).toEqual({ a: "hallo", b: "world" });
        expect(map.fr).toEqual({ a: "hello", b: "world" });
    });

    test("WIDGET_STRINGS_COMPACT reconstructs full WIDGET_STRINGS via shared/i18n.js", async () => {
        const i18nSrc = await Bun.file(
            "./public/widgets/src/shared/i18n.js",
        ).text();
        const api = new Function(
            "WIDGET_STRINGS",
            `${i18nSrc}\nreturn { setLocale, stringsFor };`,
        )(WIDGET_STRINGS_COMPACT) as {
            setLocale: (l: string) => unknown;
            stringsFor: (l: string) => unknown;
        };

        expect(WIDGET_STRINGS_COMPACT.en).toEqual(WIDGET_STRINGS_EN);
        expect(JSON.stringify(WIDGET_STRINGS_COMPACT).length).toBeLessThan(
            JSON.stringify(WIDGET_STRINGS).length,
        );
        for (const locale of Object.keys(WIDGET_STRINGS) as Array<
            keyof typeof WIDGET_STRINGS
        >) {
            expect(api.setLocale(locale)).toEqual(WIDGET_STRINGS[locale]);
            expect(api.stringsFor(locale)).toEqual(WIDGET_STRINGS[locale]);
        }
    });
});
