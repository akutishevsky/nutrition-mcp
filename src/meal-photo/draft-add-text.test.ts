import { describe, expect, test } from "bun:test";
import {
    parseDraftAddTextDeterministic,
    parseDraftAddSegment,
} from "./draft-add-text.js";

describe("parseDraftAddTextDeterministic", () => {
    test("Michael's case: 'I added a good bit of butter' → butter, 1 tbsp, stated assumption", () => {
        const parsed = parseDraftAddTextDeterministic(
            "I added a good bit of butter",
        );
        expect(parsed?.kind).toBe("add");
        if (parsed?.kind !== "add") return;
        expect(parsed.items).toHaveLength(1);
        expect(parsed.items[0]).toMatchObject({
            name: "butter",
            quantity: 1,
            unit: "tbsp",
            quantityAssumed: true,
            strongSignal: true,
        });
        expect(parsed.items[0]?.assumptions[0]).toContain("a good bit");
        expect(parsed.items[0]?.assumptions[0]).toContain("1 tbsp");
    });

    test("explicit quantities pass through the reused ingredient parser (fractions, ranges, units)", () => {
        const tbsp = parseDraftAddTextDeterministic(
            "2 tablespoons of olive oil",
        );
        expect(tbsp?.kind).toBe("add");
        if (tbsp?.kind === "add") {
            expect(tbsp.items[0]).toMatchObject({
                name: "olive oil",
                quantity: 2,
                unit: "tbsp",
                quantityAssumed: false,
                portionConfidence: 0.95,
            });
        }
        const half = parseDraftAddTextDeterministic("half a cup of rice");
        if (half?.kind === "add") {
            expect(half.items[0]).toMatchObject({ quantity: 0.5, unit: "cup" });
        }
        const word = parseDraftAddTextDeterministic("two eggs");
        if (word?.kind === "add") {
            expect(word.items[0]).toMatchObject({ name: "eggs", quantity: 2 });
        }
    });

    test("quantity-less adds get a STATED default-portion assumption, never a silent one", () => {
        const parsed = parseDraftAddTextDeterministic("added ranch dressing");
        expect(parsed?.kind).toBe("add");
        if (parsed?.kind !== "add") return;
        expect(parsed.items[0]?.name).toBe("ranch dressing");
        expect(parsed.items[0]?.quantityAssumed).toBe(true);
        expect(parsed.items[0]?.strongSignal).toBe(false);
        expect(parsed.items[0]?.assumptions[0]).toContain("default portion");
    });

    test("vague phrases scale the default portion and say so", () => {
        const little = parseDraftAddSegment("a little salt");
        expect(little).toMatchObject({ quantity: 0.5, unit: "tsp" });
        const lot = parseDraftAddSegment("a lot of butter");
        expect(lot).toMatchObject({ quantity: 2, unit: "tbsp" });
        const splash = parseDraftAddSegment("a splash of milk");
        expect(splash).toMatchObject({ quantity: 1, unit: "tsp" });
    });

    test("multiple adds split into items", () => {
        const parsed = parseDraftAddTextDeterministic(
            "I added a good bit of butter and 2 eggs",
        );
        expect(parsed?.kind).toBe("add");
        if (parsed?.kind !== "add") return;
        expect(parsed.items.map((item) => item.name)).toEqual([
            "butter",
            "eggs",
        ]);
    });

    test("compound dish names containing 'and' stay one item", () => {
        const parsed = parseDraftAddTextDeterministic("mac and cheese");
        expect(parsed?.kind).toBe("add");
        if (parsed?.kind !== "add") return;
        expect(parsed.items).toHaveLength(1);
        expect(parsed.items[0]?.name).toBe("mac and cheese");
    });

    test("replacement phrasing resolves to remove + add", () => {
        const actually = parseDraftAddTextDeterministic(
            "actually brown rice, not white rice",
        );
        expect(actually?.kind).toBe("replace");
        if (actually?.kind === "replace") {
            expect(actually.removeName).toBe("white rice");
            expect(actually.items[0]?.name).toBe("brown rice");
        }
        const instead = parseDraftAddTextDeterministic(
            "brown rice instead of white rice",
        );
        expect(instead?.kind).toBe("replace");
        const swap = parseDraftAddTextDeterministic(
            "swap white rice for brown rice",
        );
        expect(swap?.kind).toBe("replace");
        if (swap?.kind === "replace") {
            expect(swap.removeName).toBe("white rice");
        }
    });

    test("'nothing' is an explicit none, not a parse failure", () => {
        expect(parseDraftAddTextDeterministic("nothing")).toEqual({
            kind: "none",
        });
        expect(parseDraftAddTextDeterministic("That's all")).toEqual({
            kind: "none",
        });
    });

    test("prose and questions are deterministic failures (the fallback's job)", () => {
        expect(
            parseDraftAddTextDeterministic("the weather is nice today"),
        ).toBeNull();
        expect(parseDraftAddTextDeterministic("what is this?")).toBeNull();
        expect(parseDraftAddTextDeterministic("some stuff")).toBeNull();
        expect(parseDraftAddTextDeterministic("")).toBeNull();
    });
});
