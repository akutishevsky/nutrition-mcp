import { test, expect, describe } from "bun:test";
import {
    MAX_ITEMS_PER_MEAL,
    MAX_ITEM_AMOUNT,
    MAX_SAVED_MEAL_NAME_CHARS,
    MEAL_NUTRIENT_KEYS,
    applyItemChanges,
    assertMealTotals,
    buildMealItemsMeta,
    compactSugarFigure,
    findItem,
    formatItemLine,
    formatItemsBlock,
    scaleItems,
    scaleTotals,
    sumItems,
    totalsSentWithItems,
    totalsWithItemsError,
    validateItems,
    validateSavedMealName,
    normalizeNameRef,
    type MealItemInput,
    type MealItemValues,
} from "./meal-items.js";
import { ToolError } from "./errors.js";

const GATE_OFF = { addedSugarRequired: false };
const GATE_ON = { addedSugarRequired: true };

function item(over: Partial<MealItemInput> = {}): MealItemInput {
    return {
        name: "Chicken",
        amount: 150,
        unit: "g",
        calories: 250,
        protein_g: 40,
        carbs_g: 0,
        fat_g: 10,
        ...over,
    };
}

function refuses(fn: () => unknown, pattern: RegExp): ToolError {
    try {
        fn();
    } catch (err) {
        expect(err).toBeInstanceOf(ToolError);
        expect((err as ToolError).message).toMatch(pattern);
        return err as ToolError;
    }
    throw new Error("expected a refusal");
}

describe("constants", () => {
    test("bounds match the documented limits", () => {
        expect(MAX_ITEMS_PER_MEAL).toBe(30);
        expect(MAX_ITEM_AMOUNT).toBe(100_000);
        expect(MAX_SAVED_MEAL_NAME_CHARS).toBe(100);
    });
});

describe("validateItems: shape and count", () => {
    test("refuses an empty list and more than the maximum", () => {
        const err = refuses(
            () => validateItems([], GATE_OFF),
            /between 1 and 30/,
        );
        expect(err.category).toBe("meal_items_invalid");
        refuses(
            () =>
                validateItems(
                    Array.from({ length: 31 }, () => item()),
                    GATE_OFF,
                ),
            /has 31/,
        );
    });

    test("accepts exactly the maximum", () => {
        const { items } = validateItems(
            Array.from({ length: 30 }, () => item()),
            GATE_OFF,
        );
        expect(items).toHaveLength(30);
        expect(items[29]!.position).toBe(30);
    });

    test("positions are 1-based in input order, names trimmed", () => {
        const { items } = validateItems(
            [item({ name: "  Рис  " }), item({ name: "Соус" })],
            GATE_OFF,
        );
        expect(items.map((i) => [i.position, i.name])).toEqual([
            [1, "Рис"],
            [2, "Соус"],
        ]);
    });

    test("decodes escape sequences in names", () => {
        const { items } = validateItems(
            [item({ name: "\\u041a\\u0435\\u0444\\u0456\\u0440" })],
            GATE_OFF,
        );
        expect(items[0]!.name).toBe("Кефір");
    });

    test("refuses a name that is blank after trimming, naming the item", () => {
        refuses(
            () =>
                validateItems(
                    [item({ name: "Суп" }), item({ name: "   " })],
                    GATE_OFF,
                ),
            /item 2 needs a name/,
        );
    });

    test("refuses a name over 200 characters", () => {
        refuses(
            () => validateItems([item({ name: "a".repeat(201) })], GATE_OFF),
            /item 1 \("a+"\) needs a name of 1 to 200/,
        );
    });

    test("counts characters, not UTF-16 units, for names", () => {
        // 200 emoji are 400 UTF-16 units but 200 characters.
        const { items } = validateItems(
            [item({ name: "🍕".repeat(200) })],
            GATE_OFF,
        );
        expect(items[0]!.name.length).toBe(400);
    });

    test("a unit is trimmed; blank or over 20 characters becomes null", () => {
        const { items } = validateItems(
            [
                item({ unit: " pcs " }),
                item({ unit: "   " }),
                item({ unit: "x".repeat(21) }),
                item({ unit: undefined }),
            ],
            GATE_OFF,
        );
        expect(items.map((i) => i.unit)).toEqual(["pcs", null, null, null]);
    });

    test("amount is optional; when given it must be above 0 and within the maximum", () => {
        const { items } = validateItems(
            [item({ amount: undefined })],
            GATE_OFF,
        );
        expect(items[0]!.amount).toBeNull();
        refuses(
            () => validateItems([item({ amount: 0 })], GATE_OFF),
            /amount 0/,
        );
        refuses(
            () => validateItems([item({ amount: -3 })], GATE_OFF),
            /amount -3/,
        );
        refuses(
            () => validateItems([item({ amount: 100_001 })], GATE_OFF),
            /at most 100000/,
        );
        refuses(
            () => validateItems([item({ amount: Number.NaN })], GATE_OFF),
            /amount NaN/,
        );
    });

    test("the four required nutrients are named when one is absent", () => {
        const { calories: _c, ...noCalories } = item();
        refuses(
            () =>
                validateItems([item(), noCalories as MealItemInput], GATE_OFF),
            /item 2 \("Chicken"\) needs calories, protein_g, carbs_g and fat_g on every item; it has no calories/,
        );
        const { protein_g: _p, fat_g: _f, ...rest } = item();
        refuses(
            () => validateItems([rest as MealItemInput], GATE_OFF),
            /it has no protein_g, fat_g/,
        );
    });

    test("a zero is data, not absence", () => {
        const { items } = validateItems(
            [item({ carbs_g: 0, calories: 0 })],
            GATE_OFF,
        );
        expect(items[0]!.carbs_g).toBe(0);
        expect(items[0]!.calories).toBe(0);
    });

    test("values out of range or not finite are refused, naming the key", () => {
        refuses(
            () => validateItems([item({ calories: -1 })], GATE_OFF),
            /has calories -1; it must be between 0 and 20000/,
        );
        refuses(
            () => validateItems([item({ protein_g: 5001 })], GATE_OFF),
            /protein_g 5001/,
        );
        refuses(
            () => validateItems([item({ alcohol_g: 501 })], GATE_OFF),
            /alcohol_g 501; it must be between 0 and 500/,
        );
        refuses(
            () => validateItems([item({ caffeine_mg: 5001 })], GATE_OFF),
            /caffeine_mg 5001/,
        );
        refuses(
            () =>
                validateItems(
                    [item({ fiber_g: Number.POSITIVE_INFINITY })],
                    GATE_OFF,
                ),
            /fiber_g Infinity/,
        );
    });

    test("every refusal is in the meal_items_invalid category", () => {
        for (const bad of [
            () => validateItems([], GATE_OFF),
            () => validateItems([item({ amount: 0 })], GATE_OFF),
            () => validateItems([item({ calories: -1 })], GATE_OFF),
        ]) {
            const err = refuses(bad, /./);
            expect(err.category).toBe("meal_items_invalid");
        }
    });
});

describe("validateItems: fiber, sugar and added sugar", () => {
    test("fiber_g, sugar_g and added_sugar_g must be on every item or none", () => {
        for (const key of ["fiber_g", "sugar_g", "added_sugar_g"] as const) {
            refuses(
                () =>
                    validateItems(
                        [
                            item({
                                [key]: 2,
                                added_sugar_g:
                                    key === "added_sugar_g" ? 1 : undefined,
                                sugar_g: key === "sugar_g" ? 2 : undefined,
                            }),
                            item(),
                        ],
                        GATE_OFF,
                    ),
                new RegExp(`${key} is given for some items but not for item 2`),
            );
        }
    });

    test("all-or-none present is accepted and summed", () => {
        const { items, totals } = validateItems(
            [
                item({ fiber_g: 3, sugar_g: 10, added_sugar_g: 4 }),
                item({ fiber_g: 1.5, sugar_g: 2.25, added_sugar_g: 0 }),
            ],
            GATE_OFF,
        );
        expect(items[0]!.fiber_g).toBe(3);
        expect(totals.fiber_g).toBe(4.5);
        expect(totals.sugar_g).toBe(12.25);
        expect(totals.added_sugar_g).toBe(4);
    });

    test("all-absent fiber and sugar sum to null, not zero", () => {
        const { totals } = validateItems([item(), item()], GATE_OFF);
        expect(totals.fiber_g).toBeNull();
        expect(totals.sugar_g).toBeNull();
        expect(totals.added_sugar_g).toBeNull();
    });

    test("added sugar above sugar on one item is refused with the item named", () => {
        const err = refuses(
            () =>
                validateItems(
                    [item({ name: "Кола", sugar_g: 10.6, added_sugar_g: 12 })],
                    GATE_OFF,
                ),
            /item 1 \("Кола"\): added_sugar_g \(12 g\) is more than sugar_g \(10\.6 g\)/,
        );
        expect(err.category).toBe("meal_items_invalid");
    });

    test("the gate on: sugar_g without added_sugar_g is refused with the added-sugar category", () => {
        const err = refuses(
            () =>
                validateItems(
                    [
                        item({ sugar_g: 0, fiber_g: 0 }),
                        item({ sugar_g: 1, fiber_g: 0 }),
                    ],
                    GATE_ON,
                ),
            /added_sugar_g is required whenever sugar_g is given/,
        );
        expect(err.category).toBe("added_sugar_missing");
    });

    test("the gate off: the same item is accepted", () => {
        const { totals } = validateItems([item({ sugar_g: 35 })], GATE_OFF);
        expect(totals.sugar_g).toBe(35);
        expect(totals.added_sugar_g).toBeNull();
    });

    test("the gate on: an item with added sugar passes", () => {
        const { items } = validateItems(
            [item({ sugar_g: 35, added_sugar_g: 35 })],
            GATE_ON,
        );
        expect(items[0]!.added_sugar_g).toBe(35);
    });

    test("the gate on: an item with no sugar at all does not need added sugar", () => {
        expect(() => validateItems([item()], GATE_ON)).not.toThrow();
    });
});

describe("validateItems: saturated and trans fat", () => {
    test("saturated_fat_g must be on every item or none", () => {
        refuses(
            () =>
                validateItems([item({ saturated_fat_g: 4 }), item()], GATE_OFF),
            /saturated_fat_g is given for some items but not for item 2/,
        );
    });

    test("saturated fat on every item is accepted and summed to two decimals", () => {
        const { items, totals } = validateItems(
            [item({ saturated_fat_g: 1.11 }), item({ saturated_fat_g: 2.22 })],
            GATE_OFF,
        );
        expect(items[0]!.saturated_fat_g).toBe(1.11);
        expect(totals.saturated_fat_g).toBe(3.33);
    });

    test("saturated fat on no item is null in the items and the totals", () => {
        const { items, totals } = validateItems([item(), item()], GATE_OFF);
        expect(items[0]!.saturated_fat_g).toBeNull();
        expect(totals.saturated_fat_g).toBeNull();
    });

    test("trans fat is optional per item and summed over the items that carry it", () => {
        const { items, totals } = validateItems(
            [item({ trans_fat_g: 0.2 }), item(), item({ trans_fat_g: 0.3 })],
            GATE_OFF,
        );
        expect(items[1]!.trans_fat_g).toBeNull();
        expect(totals.trans_fat_g).toBe(0.5);
    });

    test("trans fat on no item sums to null, never 0", () => {
        const { totals } = validateItems([item(), item()], GATE_OFF);
        expect(totals.trans_fat_g).toBeNull();
    });

    test("saturated and trans fat outside their range are refused by name", () => {
        refuses(
            () => validateItems([item({ saturated_fat_g: -1 })], GATE_OFF),
            /item 1 \("Chicken"\) has saturated_fat_g -1/,
        );
        refuses(
            () => validateItems([item({ trans_fat_g: 6000 })], GATE_OFF),
            /has trans_fat_g 6000; it must be between 0 and/,
        );
    });

    test("MEAL_NUTRIENT_KEYS carries both fats", () => {
        expect(MEAL_NUTRIENT_KEYS).toContain("saturated_fat_g");
        expect(MEAL_NUTRIENT_KEYS).toContain("trans_fat_g");
    });

    test("scaling scales both fats; a null trans fat stays null", () => {
        const { items } = validateItems(
            [
                item({ amount: 100, saturated_fat_g: 2, trans_fat_g: 0.1 }),
                item({ amount: 50, saturated_fat_g: 1 }),
            ],
            GATE_OFF,
        );
        const [first, second] = scaleItems(items, 2);
        expect(first!.saturated_fat_g).toBe(4);
        expect(first!.trans_fat_g).toBe(0.2);
        expect(second!.trans_fat_g).toBeNull();
        expect(scaleTotals(sumItems(items), 0.5).saturated_fat_g).toBe(1.5);
    });

    test("the item summary line names a fat only when it is recorded", () => {
        const { items } = validateItems(
            [
                item({ saturated_fat_g: 4.2, trans_fat_g: 0.1 }),
                item({ saturated_fat_g: 0 }),
            ],
            GATE_OFF,
        );
        const withFat = formatItemLine(items[0]!, false);
        expect(withFat).toContain("saturated fat 4.2 g");
        expect(withFat).toContain("trans fat 0.1 g");
        const without = formatItemLine(items[1]!, false);
        expect(without).toContain("saturated fat 0 g");
        expect(without).not.toContain("trans fat");
    });
});

describe("validateItems: sums", () => {
    test("sums round to two decimals, no float noise", () => {
        const { totals } = validateItems(
            [
                item({ protein_g: 0.1, calories: 0.1 }),
                item({ protein_g: 0.2, calories: 0.2 }),
            ],
            GATE_OFF,
        );
        expect(totals.protein_g).toBe(0.3);
        expect(totals.calories).toBe(0.3);
    });

    test("calories are not rounded to a whole number here", () => {
        const { totals } = validateItems(
            [item({ calories: 100.4 }), item({ calories: 100.4 })],
            GATE_OFF,
        );
        expect(totals.calories).toBe(200.8);
    });

    test("alcohol and caffeine sum over the items that carry them; null when none does", () => {
        const { totals } = validateItems(
            [
                item({ alcohol_g: 14, caffeine_mg: 80 }),
                item(),
                item({ caffeine_mg: 20.5 }),
            ],
            GATE_OFF,
        );
        expect(totals.alcohol_g).toBe(14);
        expect(totals.caffeine_mg).toBe(100.5);
        const none = validateItems([item()], GATE_OFF).totals;
        expect(none.alcohol_g).toBeNull();
        expect(none.caffeine_mg).toBeNull();
    });

    test("sumItems matches the totals validateItems returns", () => {
        const { items, totals } = validateItems(
            [item({ fiber_g: 2 }), item({ fiber_g: 3 })],
            GATE_OFF,
        );
        expect(sumItems(items)).toEqual(totals);
    });
});

describe("totals alongside items", () => {
    test("totalsSentWithItems returns the keys that are not undefined", () => {
        expect(
            totalsSentWithItems({
                calories: 100,
                protein_g: undefined,
                fat_g: null,
            }),
        ).toEqual(["calories", "fat_g"]);
        expect(totalsSentWithItems({})).toEqual([]);
    });

    test("totalsWithItemsError names the keys and is categorised", () => {
        const err = totalsWithItemsError(["calories", "protein_g"]);
        expect(err).toBeInstanceOf(ToolError);
        expect(err.message).toBe(
            "Send either items or the meal totals (calories, protein_g), not both: with items the totals are the sum of the items.",
        );
        expect(err.category).toBe("meal_items_invalid");
    });
});

describe("scaling", () => {
    const { items } = validateItems(
        [
            item({ amount: 150, fiber_g: 3, sugar_g: 1, added_sugar_g: 0.5 }),
            item({
                amount: undefined,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            }),
        ],
        GATE_OFF,
    );

    test("scaleItems multiplies amounts and nutrients and keeps positions", () => {
        const scaled = scaleItems(items, 2);
        expect(scaled[0]!.amount).toBe(300);
        expect(scaled[0]!.calories).toBe(500);
        expect(scaled[0]!.fiber_g).toBe(6);
        expect(scaled[0]!.position).toBe(1);
        expect(scaled[1]!.amount).toBeNull();
        expect(scaled[1]!.fiber_g).toBe(0);
    });

    test("scaleItems rounds to two decimals", () => {
        const scaled = scaleItems(items, 1 / 3);
        expect(scaled[0]!.calories).toBe(83.33);
        expect(scaled[0]!.amount).toBe(50);
    });

    test("scaleTotals keeps null and scales the rest", () => {
        const t = scaleTotals(
            { ...sumItems(items), alcohol_g: null, caffeine_mg: 90 },
            0.5,
        );
        expect(t.calories).toBe(250);
        expect(t.alcohol_g).toBeNull();
        expect(t.caffeine_mg).toBe(45);
    });
});

describe("findItem", () => {
    const { items } = validateItems(
        [
            item({ name: "Стріпси" }),
            item({ name: "Соус гірчичний" }),
            item({ name: "соус гірчичний" }),
        ],
        GATE_OFF,
    );

    test("a position number picks that item", () => {
        expect(findItem(items, "1").name).toBe("Стріпси");
        expect(findItem(items, " 2 ").position).toBe(2);
    });

    test("an exact name matches case-insensitively and ignores surrounding space", () => {
        expect(findItem(items, "  СТРІПСИ ").position).toBe(1);
    });

    test("no match lists the items", () => {
        const err = refuses(
            () => findItem(items, "Картопля"),
            /No item matches "Картопля"/,
        );
        expect(err.message).toContain("1. Стріпси");
        expect(err.category).toBe("meal_items_invalid");
    });

    test("several name matches are refused, listing the items", () => {
        const err = refuses(
            () => findItem(items, "соус гірчичний"),
            /matches 2 items; give the position number instead/,
        );
        expect(err.message).toContain("3. соус гірчичний");
    });

    test("an out-of-range position is a no-match", () => {
        refuses(() => findItem(items, "9"), /No item matches "9"/);
    });
});

describe("applyItemChanges", () => {
    const base = validateItems(
        [
            item({
                name: "Стріпси",
                amount: 170,
                calories: 425,
                protein_g: 34,
                carbs_g: 22,
                fat_g: 22,
            }),
            item({
                name: "Соус",
                amount: 40,
                calories: 80,
                protein_g: 0,
                carbs_g: 20,
                fat_g: 0,
            }),
            item({
                name: "Кава",
                amount: undefined,
                calories: 5,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
            }),
        ],
        GATE_OFF,
    ).items;

    test("no changes returns the same items", () => {
        expect(applyItemChanges(base, {})).toEqual(base);
    });

    test("leave_out removes items and renumbers positions", () => {
        const out = applyItemChanges(base, { leave_out: ["соус"] });
        expect(out.map((i) => [i.position, i.name])).toEqual([
            [1, "Стріпси"],
            [2, "Кава"],
        ]);
    });

    test("leave_out cannot name every item", () => {
        refuses(
            () => applyItemChanges(base, { leave_out: ["1", "2", "3"] }),
            /names every item/,
        );
    });

    test("item_amounts sets the amount and scales that item's nutrients", () => {
        const out = applyItemChanges(base, {
            item_amounts: [{ item: "1", amount: 85 }],
        });
        expect(out[0]!.amount).toBe(85);
        expect(out[0]!.calories).toBe(212.5);
        expect(out[0]!.protein_g).toBe(17);
        expect(out[1]!.calories).toBe(80);
    });

    test("an item with no amount cannot be given one", () => {
        refuses(
            () =>
                applyItemChanges(base, {
                    item_amounts: [{ item: "3", amount: 10 }],
                }),
            /item 3 \("Кава"\) has no amount to change/,
        );
    });

    test("an item named twice in item_amounts is refused", () => {
        refuses(
            () =>
                applyItemChanges(base, {
                    item_amounts: [
                        { item: "1", amount: 100 },
                        { item: "Стріпси", amount: 90 },
                    ],
                }),
            /listed more than once/,
        );
    });

    test("an item both left out and given an amount is refused", () => {
        refuses(
            () =>
                applyItemChanges(base, {
                    leave_out: ["2"],
                    item_amounts: [{ item: "2", amount: 10 }],
                }),
            /both left out and given an amount/,
        );
    });

    test("an out-of-range new amount is refused", () => {
        refuses(
            () =>
                applyItemChanges(base, {
                    item_amounts: [{ item: "1", amount: 0 }],
                }),
            /has amount 0/,
        );
    });

    test("an unknown reference in either list is refused", () => {
        refuses(
            () => applyItemChanges(base, { leave_out: ["Торт"] }),
            /No item matches/,
        );
        refuses(
            () =>
                applyItemChanges(base, {
                    item_amounts: [{ item: "Торт", amount: 5 }],
                }),
            /No item matches/,
        );
    });

    test("references resolve against the saved list, then positions renumber", () => {
        // "2" is the sauce in the saved list; leaving out item 1 must not move it.
        const out = applyItemChanges(base, {
            leave_out: ["1"],
            item_amounts: [{ item: "2", amount: 20 }],
        });
        expect(out.map((i) => [i.position, i.name, i.amount])).toEqual([
            [1, "Соус", 20],
            [2, "Кава", null],
        ]);
    });
});

describe("formatting", () => {
    const withAll = validateItems(
        [
            item({
                name: "Стріпси оригінальні ×5",
                amount: 170,
                unit: "g",
                calories: 425,
                protein_g: 34,
                carbs_g: 22,
                fat_g: 22,
            }),
        ],
        GATE_OFF,
    ).items[0]!;

    test("a full line: name, amount and unit, then the figures", () => {
        expect(formatItemLine(withAll, false)).toBe(
            "1. Стріпси оригінальні ×5 — 170 g — 425 kcal · P 34 g · C 22 g · F 22 g",
        );
    });

    test("amount is omitted when null and unit when null", () => {
        const noAmount: MealItemValues = {
            ...withAll,
            amount: null,
            unit: null,
        };
        expect(formatItemLine(noAmount, false)).toBe(
            "1. Стріпси оригінальні ×5 — 425 kcal · P 34 g · C 22 g · F 22 g",
        );
        const amountNoUnit: MealItemValues = { ...withAll, unit: null };
        expect(formatItemLine(amountNoUnit, false)).toContain(
            " — 170 — 425 kcal",
        );
    });

    test("optional nutrients appear only when non-null, alcohol only when enabled", () => {
        const rich: MealItemValues = {
            ...withAll,
            fiber_g: 3,
            sugar_g: 9,
            added_sugar_g: 4,
            alcohol_g: 14,
            caffeine_mg: 80.4,
        };
        const hidden = formatItemLine(rich, false);
        expect(hidden).toContain(
            "fiber 3 g · sugar 9 g (4 added) · caffeine 80 mg",
        );
        expect(hidden).not.toContain("alcohol");
        expect(formatItemLine(rich, true)).toContain("alcohol 14 g");
    });

    test("formatItemsBlock is empty for no items and indents each line", () => {
        expect(formatItemsBlock([], false)).toBe("");
        const block = formatItemsBlock(
            [withAll, { ...withAll, position: 2, name: "Соус" }],
            false,
        );
        const lines = block.split("\n");
        expect(lines[0]).toBe("Items:");
        expect(lines[1]!.startsWith("  1. ")).toBe(true);
        expect(lines[2]!.startsWith("  2. Соус")).toBe(true);
    });
});

describe("validateSavedMealName", () => {
    test("trims and decodes", () => {
        expect(validateSavedMealName("  Сніданок\\u0021 ")).toBe("Сніданок!");
    });

    test("refuses blank and over-long names", () => {
        expect(() => validateSavedMealName("   ")).toThrow(ToolError);
        expect(() => validateSavedMealName("x".repeat(101))).toThrow(
            /1 to 100 characters/,
        );
        expect(validateSavedMealName("x".repeat(100))).toHaveLength(100);
    });
});

describe("scaling never drops a positive amount to 0 (C1)", () => {
    const { items } = validateItems(
        [
            item({ name: "Saffron", amount: 0.004, unit: "g", calories: 0 }),
            item({ name: "Salt", amount: 0.02, unit: "g", calories: 0 }),
        ],
        GATE_OFF,
    );

    test("factor 1 returns the items unchanged", () => {
        expect(scaleItems(items, 1)).toEqual(items);
        const t = sumItems(items);
        expect(scaleTotals(t, 1)).toEqual(t);
    });

    test("a sub-0.005 amount survives scaling and stays positive", () => {
        const scaled = scaleItems(items, 0.2);
        expect(scaled[0]!.amount).toBeGreaterThan(0);
        expect(scaled[0]!.amount).toBeCloseTo(0.0008, 10);
        // 0.02 x 0.2 = 0.004, which two-decimal rounding turned into 0.
        expect(scaled[1]!.amount).toBe(0.004);
    });

    test("amounts keep up to four decimals", () => {
        const scaled = scaleItems(items, 1.5);
        expect(scaled[0]!.amount).toBe(0.006);
        expect(scaled[1]!.amount).toBe(0.03);
        expect(scaleItems(items, 1 / 3)[1]!.amount).toBe(0.0067);
    });
});

describe("meal totals bounds (C5, C8)", () => {
    const zero = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        saturated_fat_g: null,
        trans_fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
    };

    test("assertMealTotals accepts totals at the bounds", () => {
        expect(() =>
            assertMealTotals({
                ...zero,
                calories: 20_000,
                protein_g: 5_000,
                alcohol_g: 500,
                caffeine_mg: 5_000,
            }),
        ).not.toThrow();
    });

    test("assertMealTotals refuses each figure past its bound, naming it", () => {
        for (const [key, v, max] of [
            ["calories", 20_001, 20_000],
            ["fat_g", 5_001, 5_000],
            ["alcohol_g", 501, 500],
            ["caffeine_mg", 5_001, 5_000],
        ] as const) {
            const err = refuses(
                () => assertMealTotals({ ...zero, [key]: v }),
                new RegExp(
                    `${key} ${v}.*most a single meal can hold \\(${max}\\)`,
                ),
            );
            expect(err.category).toBe("meal_items_invalid");
            expect(err.message).toContain("amounts and units");
        }
        refuses(
            () => assertMealTotals({ ...zero, calories: Infinity }),
            /calories Infinity/,
        );
    });

    test("the refusal avoids the words categorizeError's wording tiers match", () => {
        const err = refuses(
            () => assertMealTotals({ ...zero, calories: 30_000 }),
            /calories/,
        );
        expect(err.message.toLowerCase()).not.toMatch(
            /date|format|required|missing|rate|limit|auth|token|expired/,
        );
    });

    test("validateItems refuses items whose sum passes a meal bound", () => {
        const many = Array.from({ length: 3 }, (_, i) =>
            item({ name: `Big ${i}`, calories: 8_000 }),
        );
        refuses(
            () => validateItems(many, GATE_OFF),
            /calories 24000, above the most a single meal can hold/,
        );
    });

    test("an item_amounts change that takes an item past a bound is refused, naming its unit", () => {
        const saved = validateItems(
            [
                item({
                    name: "Chicken breast",
                    amount: 1,
                    unit: "pcs",
                    calories: 250,
                    protein_g: 31,
                }),
            ],
            GATE_OFF,
        ).items;
        const err = refuses(
            () =>
                applyItemChanges(saved, {
                    item_amounts: [{ item: "Chicken breast", amount: 150 }],
                }),
            /item 1 \("Chicken breast"\) at 150 pcs comes to calories 37500/,
        );
        expect(err.message).toContain("(1 pcs)");
        expect(err.logText).not.toContain("Chicken");
        // The unit is user text too; the log names the item by position only.
        expect(err.logText).not.toContain("pcs");
        expect(err.logText).toContain("item 1 at 150 comes to calories 37500");
    });
});

describe("escaped references (C3)", () => {
    const { items } = validateItems(
        [item({ name: "\\u0420\\u0438\\u0441", unit: "\\u0433" })],
        GATE_OFF,
    );

    test("names and units are stored decoded", () => {
        expect(items[0]!.name).toBe("Рис");
        expect(items[0]!.unit).toBe("г");
    });

    test("findItem decodes an escaped reference", () => {
        expect(findItem(items, "\\u0420\\u0438\\u0441").position).toBe(1);
        expect(findItem(items, " \\u0440\\u0438\\u0441 ").position).toBe(1);
    });

    test("normalizeNameRef decodes and trims", () => {
        expect(
            normalizeNameRef(
                "  \\u0421\\u043d\\u0456\\u0434\\u0430\\u043d\\u043e\\u043a ",
            ),
        ).toBe("Сніданок");
    });
});

describe("refusals keep item names out of the runtime-log text (C2)", () => {
    const { items } = validateItems(
        [
            item({ name: "Соус гірчичний", amount: 40 }),
            item({ name: "Стріпси", amount: undefined }),
        ],
        GATE_OFF,
    );

    const cases: [string, () => unknown][] = [
        ["no match", () => findItem(items, "tomato")],
        [
            "ambiguous",
            () =>
                findItem(
                    validateItems(
                        [item({ name: "Соус" }), item({ name: "соус" })],
                        GATE_OFF,
                    ).items,
                    "соус",
                ),
        ],
        [
            "no amount",
            () =>
                applyItemChanges(items, {
                    item_amounts: [{ item: "2", amount: 5 }],
                }),
        ],
        [
            "twice",
            () =>
                applyItemChanges(items, {
                    item_amounts: [
                        { item: "1", amount: 5 },
                        { item: "Соус гірчичний", amount: 6 },
                    ],
                }),
        ],
        [
            "left out and given an amount",
            () =>
                applyItemChanges(items, {
                    leave_out: ["1"],
                    item_amounts: [{ item: "1", amount: 5 }],
                }),
        ],
        [
            "bad amount",
            () =>
                applyItemChanges(items, {
                    item_amounts: [{ item: "1", amount: -1 }],
                }),
        ],
        [
            "missing nutrient",
            () =>
                validateItems(
                    [item({ name: "Соус гірчичний", fat_g: undefined })],
                    GATE_OFF,
                ),
        ],
        [
            "partial fiber",
            () =>
                validateItems(
                    [
                        item({ name: "Стріпси", fiber_g: 1 }),
                        item({ name: "Соус гірчичний" }),
                    ],
                    GATE_OFF,
                ),
        ],
        [
            "added above sugar",
            () =>
                validateItems(
                    [
                        item({
                            name: "Соус гірчичний",
                            sugar_g: 1,
                            added_sugar_g: 2,
                        }),
                    ],
                    GATE_OFF,
                ),
        ],
    ];

    for (const [label, run] of cases) {
        test(label, () => {
            let caught: unknown;
            try {
                run();
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeInstanceOf(ToolError);
            const err = caught as ToolError;
            expect(err.logText).toBeDefined();
            for (const name of ["Соус", "соус", "Стріпси", "tomato"]) {
                expect(err.logText!).not.toContain(name);
            }
            expect(err.category).toBe("meal_items_invalid");
        });
    }

    test("the caller still sees the names", () => {
        try {
            findItem(items, "tomato");
        } catch (e) {
            expect((e as ToolError).message).toContain("Соус гірчичний");
            expect((e as ToolError).logText).toBe(
                "No item matches the reference (2 items).",
            );
        }
    });
});

describe("compactSugarFigure (C6)", () => {
    test("added sugar is bracketed on sugar, never a sibling figure", () => {
        expect(compactSugarFigure(35, 35)).toBe("sugar 35 g (35 added)");
        expect(compactSugarFigure(9, null)).toBe("sugar 9 g");
        expect(compactSugarFigure(null, 4)).toBe("added sugar 4 g");
        expect(compactSugarFigure(null, null)).toBeNull();
        expect(compactSugarFigure(0, 0)).toBe("sugar 0 g (0 added)");
    });

    test("an item line never prints added sugar beside sugar", () => {
        const [cola] = validateItems(
            [item({ name: "Cola", sugar_g: 35, added_sugar_g: 35 })],
            GATE_OFF,
        ).items;
        const line = formatItemLine(cola!, false);
        expect(line).toContain("sugar 35 g (35 added)");
        expect(line).not.toContain("added sugar");
    });
});

describe("buildMealItemsMeta", () => {
    function values(
        position: number,
        name: string,
        over: Partial<MealItemValues> = {},
    ): MealItemValues {
        return {
            position,
            name,
            amount: null,
            unit: null,
            calories: 100,
            protein_g: 5,
            carbs_g: 10,
            fat_g: 3,
            saturated_fat_g: null,
            trans_fat_g: null,
            fiber_g: null,
            sugar_g: null,
            added_sugar_g: null,
            alcohol_g: null,
            caffeine_mg: null,
            ...over,
        };
    }
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];

    test("one slot per row, in row order, null where a meal has no items", () => {
        const items = new Map([
            ["c", [values(1, "Fusilli"), values(2, "Pesto")]],
            ["a", []],
        ]);
        const meta = buildMealItemsMeta(rows, items, true)!;
        expect(meta.v).toBe(1);
        expect(meta.meals).toHaveLength(3);
        expect(meta.meals[0]).toBeNull();
        expect(meta.meals[1]).toBeNull();
        expect(meta.meals[2]!.map((i) => i.name)).toEqual(["Fusilli", "Pesto"]);
    });

    test("null when no row has items, so the caller omits the key", () => {
        expect(buildMealItemsMeta(rows, new Map(), true)).toBeNull();
        expect(
            buildMealItemsMeta(rows, new Map([["z", [values(1, "x")]]]), true),
        ).toBeNull();
        expect(buildMealItemsMeta([], new Map(), true)).toBeNull();
    });

    test("whitelisted fields only, rounded like the breakdown rows", () => {
        const meta = buildMealItemsMeta(
            [{ id: "a" }],
            new Map([
                [
                    "a",
                    [
                        values(1, "Крило", {
                            amount: 120,
                            unit: "g",
                            calories: 300.5,
                            protein_g: 25.04,
                            fiber_g: 0,
                            caffeine_mg: 80.26,
                        }),
                    ],
                ],
            ]),
            true,
        )!;
        expect(meta.meals[0]![0]).toEqual({
            name: "Крило",
            amount: 120,
            unit: "g",
            calories: 301,
            protein_g: 25,
            carbs_g: 10,
            fat_g: 3,
            saturated_fat_g: null,
            trans_fat_g: null,
            fiber_g: 0,
            sugar_g: null,
            added_sugar_g: null,
            alcohol_g: null,
            caffeine_mg: 80.3,
        });
    });

    test("alcohol is null on every item when tracking is off", () => {
        const items = new Map([["a", [values(1, "Beer", { alcohol_g: 14 })]]]);
        expect(
            buildMealItemsMeta([{ id: "a" }], items, false)!.meals[0]![0]!
                .alcohol_g,
        ).toBeNull();
        expect(
            buildMealItemsMeta([{ id: "a" }], items, true)!.meals[0]![0]!
                .alcohol_g,
        ).toBe(14);
    });
});

describe("buildMealItemsMeta: saturated and trans fat", () => {
    test("each ingredient carries both fats, rounded to a tenth, null when absent", () => {
        const item: MealItemValues = {
            position: 1,
            name: "Butter",
            amount: 10,
            unit: "g",
            calories: 72,
            protein_g: 0.1,
            carbs_g: 0,
            fat_g: 8,
            saturated_fat_g: 5.06,
            trans_fat_g: 0.34,
            fiber_g: null,
            sugar_g: null,
            added_sugar_g: null,
            alcohol_g: null,
            caffeine_mg: null,
        };
        const bare = {
            ...item,
            position: 2,
            name: "Oil",
            saturated_fat_g: null,
            trans_fat_g: null,
        };
        const meta = buildMealItemsMeta(
            [{ id: "m" }],
            new Map([["m", [item, bare]]]),
            false,
        );
        expect(meta?.meals[0]?.[0]?.saturated_fat_g).toBe(5.1);
        expect(meta?.meals[0]?.[0]?.trans_fat_g).toBe(0.3);
        expect(meta?.meals[0]?.[1]?.saturated_fat_g).toBeNull();
        expect(meta?.meals[0]?.[1]?.trans_fat_g).toBeNull();
    });
});
