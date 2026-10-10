import { test, expect, describe } from "bun:test";
import {
    PROVENANCE_NUTRIENT_KEYS,
    TOLERANCE,
    assertFoodRefPlacement,
    basisFactor,
    buildNutrientSourcesMeta,
    deriveMealProvenance,
    formatItemSourcesBlock,
    formatSourcesLine,
    META_NAME_CHARS,
    MAX_SOURCE_NAME_CHARS,
    mergeProvenance,
    parseFoodRef,
    parseNutrientSources,
    parseSourceDetail,
    referenceFromFood,
    referenceFromUsda,
    resolveNutrientSources,
    scaleSourceDetail,
    toleranceFor,
    verifiedKeys,
    metaFor,
    type FoodRef,
    type LoggedValues,
    type NutrientSources,
    type ReferenceRecord,
    type SourceDetail,
} from "./provenance.js";
import { MEAL_NUTRIENT_KEYS } from "./meal-items.js";
import type { FoodResult } from "./foods.js";
import { ToolError } from "./errors.js";
import { usdaRecordFromPayload, usdaSourceId } from "./usda-record.js";

const FDC = "171477";
const BARCODE = "5449000000996";

/** A per-100 g USDA record with the given values. */
function usda(
    per100g: LoggedValues,
    overrides: Partial<ReferenceRecord> = {},
): ReferenceRecord {
    return {
        source: "usda",
        id: FDC,
        name: "Chicken, breast, meat only, cooked, grilled",
        data_type: "SR Legacy",
        basis: "per_100g",
        values: per100g,
        added_sugar_estimated: false,
        fetched_at: "2026-10-01T00:00:00.000Z",
        ...overrides,
    };
}

/** A per-100 g ref to the USDA record. */
const usdaRef = (amount_g: number): FoodRef => ({
    source: "usda",
    id: FDC,
    amount_g,
});

/** Asserts a function throws a food_ref_invalid ToolError, and returns it. */
function expectRefused(fn: () => unknown): ToolError {
    try {
        fn();
    } catch (err) {
        expect(err).toBeInstanceOf(ToolError);
        expect((err as ToolError).category).toBe("food_ref_invalid");
        return err as ToolError;
    }
    throw new Error("expected a food_ref_invalid refusal");
}

describe("constants", () => {
    test("PROVENANCE_NUTRIENT_KEYS is MEAL_NUTRIENT_KEYS, in order", () => {
        expect([...PROVENANCE_NUTRIENT_KEYS]).toEqual([...MEAL_NUTRIENT_KEYS]);
    });

    test("tolerance constants are the documented ones", () => {
        expect(TOLERANCE).toEqual({
            grams: 0.5,
            kcal: 1,
            mg: 1,
            relative: 0.01,
        });
    });
});

describe("toleranceFor: boundary table", () => {
    // [key, expected, tolerance]: the floor wins below the crossover, the
    // relative share above it. Crossovers: grams at 50 g, kcal at 100 kcal,
    // caffeine at 100 mg.
    const rows: [Parameters<typeof toleranceFor>[0], number, number][] = [
        ["protein_g", 0, 0.5],
        ["protein_g", 10, 0.5],
        ["protein_g", 50, 0.5],
        ["protein_g", 50.01, 0.5001],
        ["protein_g", 200, 2],
        ["fat_g", 5, 0.5],
        ["sugar_g", 60, 0.6],
        ["fiber_g", 1000, 10],
        ["saturated_fat_g", 20, 0.5],
        ["trans_fat_g", 0.4, 0.5],
        ["added_sugar_g", 25, 0.5],
        ["alcohol_g", 14, 0.5],
        ["calories", 0, 1],
        ["calories", 80, 1],
        ["calories", 100, 1],
        ["calories", 250, 2.5],
        ["caffeine_mg", 0, 1],
        ["caffeine_mg", 95, 1],
        ["caffeine_mg", 150, 1.5],
    ];
    for (const [key, expected, tol] of rows) {
        test(`${key} at ${expected} allows ±${tol}`, () => {
            expect(toleranceFor(key, expected)).toBeCloseTo(tol, 10);
        });
    }
});

describe("basisFactor", () => {
    test("a per-100 g record takes amount_g, scaled by amount / 100", () => {
        expect(basisFactor(usdaRef(150), usda({}))).toBeCloseTo(1.5, 10);
    });

    test("a per-100 g record refuses servings", () => {
        const err = expectRefused(() =>
            basisFactor({ source: "usda", id: FDC, servings: 2 }, usda({})),
        );
        expect(err.message).toContain("per 100 g");
    });

    test("a per-100 g record with no amount_g is refused", () => {
        expectRefused(() =>
            basisFactor({ source: "openfoodfacts", id: BARCODE }, usda({})),
        );
    });

    test("a per-serving record takes servings, as the factor", () => {
        const rec = usda({}, { basis: "per_serving" });
        expect(
            basisFactor(
                { source: "openfoodfacts", id: BARCODE, servings: 2.5 },
                rec,
            ),
        ).toBe(2.5);
    });

    test("a per-serving record refuses amount_g", () => {
        const rec = usda({}, { basis: "per_serving" });
        expectRefused(() =>
            basisFactor(
                { source: "openfoodfacts", id: BARCODE, amount_g: 30 },
                rec,
            ),
        );
    });
});

describe("verifiedKeys: matching within tolerance", () => {
    // Per 100 g: 200 kcal, 40 g carbs, 10 g fat, 10 mg caffeine.
    const rec = usda({
        calories: 200,
        carbs_g: 40,
        fat_g: 10,
        caffeine_mg: 10,
    });

    test("an exact match verifies", () => {
        const keys = verifiedKeys(usdaRef(100), rec, {
            calories: 200,
            carbs_g: 40,
            fat_g: 10,
            caffeine_mg: 10,
        });
        expect([...keys].sort()).toEqual([
            "caffeine_mg",
            "calories",
            "carbs_g",
            "fat_g",
        ]);
    });

    test("the amount scales the record: 150 g is 1.5 times the values", () => {
        const keys = verifiedKeys(usdaRef(150), rec, {
            calories: 300,
            carbs_g: 60,
        });
        expect(keys.has("calories")).toBe(true);
        expect(keys.has("carbs_g")).toBe(true);
    });

    test("calories: the 1 kcal floor below 100 kcal, 1% above it", () => {
        const low = usda({ calories: 80 });
        const at = (rec: ReferenceRecord, amount: number, kcal: number) =>
            verifiedKeys(usdaRef(amount), rec, { calories: kcal }).has(
                "calories",
            );
        expect(at(low, 100, 81)).toBe(true);
        expect(at(low, 100, 79)).toBe(true);
        expect(at(low, 100, 81.01)).toBe(false);
        // 200 kcal expected: 1% is 2 kcal, which is above the floor.
        expect(at(rec, 100, 202)).toBe(true);
        expect(at(rec, 100, 202.01)).toBe(false);
    });

    test("grams: a 0.5 g difference matches, 0.6 g on 10 g does not", () => {
        const at = (fat: number) =>
            verifiedKeys(usdaRef(100), rec, { fat_g: fat }).has("fat_g");
        expect(at(10.5)).toBe(true);
        expect(at(9.5)).toBe(true);
        expect(at(10.6)).toBe(false);
    });

    test("relative share: 1% of a large value takes over from the 0.5 g floor", () => {
        // 40 g per 100 g at 500 g: expected 200 g, tolerance 2 g.
        const big = usda({ carbs_g: 40 });
        const at = (c: number) =>
            verifiedKeys(usdaRef(500), big, { carbs_g: c }).has("carbs_g");
        expect(at(202)).toBe(true);
        expect(at(198)).toBe(true);
        expect(at(202.01)).toBe(false);
    });

    test("caffeine: the 1 mg floor", () => {
        const at = (mg: number) =>
            verifiedKeys(usdaRef(100), rec, { caffeine_mg: mg }).has(
                "caffeine_mg",
            );
        expect(at(11)).toBe(true);
        expect(at(11.01)).toBe(false);
    });

    test("a claimed ref whose numbers match the wrong amount does not verify", () => {
        // 10 g fat per 100 g at 300 g is 30 g; the logged 10 g is the per-100 g figure.
        const keys = verifiedKeys(usdaRef(300), rec, { fat_g: 10 });
        expect(keys.has("fat_g")).toBe(false);
    });

    test("a record value that is null or absent verifies nothing", () => {
        const sparse = usda({ calories: null, fiber_g: null });
        const keys = verifiedKeys(usdaRef(100), sparse, {
            calories: 200,
            fiber_g: 3,
            sugar_g: 5,
        });
        expect(keys.size).toBe(0);
    });

    test("a logged value that is null is not verified", () => {
        expect(verifiedKeys(usdaRef(100), rec, { calories: null }).size).toBe(
            0,
        );
    });

    test("an estimated OFF added sugar never verifies", () => {
        const off = usda(
            { added_sugar_g: 12, sugar_g: 20 },
            {
                source: "openfoodfacts",
                id: BARCODE,
                basis: "per_serving",
                added_sugar_estimated: true,
            },
        );
        const keys = verifiedKeys(
            { source: "openfoodfacts", id: BARCODE, servings: 1 },
            off,
            { added_sugar_g: 12, sugar_g: 20 },
        );
        expect(keys.has("added_sugar_g")).toBe(false);
        expect(keys.has("sugar_g")).toBe(true);
    });
});

describe("parseFoodRef", () => {
    test("a usda ref with an amount parses, a numeric id becomes a string", () => {
        expect(
            parseFoodRef({ source: "usda", id: 171477, amount_g: 150 }),
        ).toEqual({
            source: "usda",
            id: "171477",
            amount_g: 150,
        });
    });

    test("an OFF ref takes servings or amount_g", () => {
        expect(
            parseFoodRef({ source: "openfoodfacts", id: BARCODE, servings: 2 }),
        ).toEqual({ source: "openfoodfacts", id: BARCODE, servings: 2 });
        expect(
            parseFoodRef({
                source: "openfoodfacts",
                id: BARCODE,
                amount_g: 330,
            }),
        ).toEqual({ source: "openfoodfacts", id: BARCODE, amount_g: 330 });
    });

    test("refusals are food_ref_invalid ToolErrors", () => {
        const bad: unknown[] = [
            null,
            "usda",
            { source: "web", id: FDC, amount_g: 100 },
            { source: "usda", id: "abc", amount_g: 100 },
            { source: "usda", id: "0", amount_g: 100 },
            { source: "usda", id: "12345678901", amount_g: 100 },
            { source: "usda", id: FDC },
            { source: "usda", id: FDC, amount_g: 0 },
            { source: "usda", id: FDC, amount_g: -5 },
            { source: "usda", id: FDC, amount_g: 100_001 },
            { source: "usda", id: FDC, amount_g: "150" },
            { source: "usda", id: FDC, amount_g: 100, servings: 1 },
            { source: "usda", id: FDC, amount_g: 100, servings: 0 },
            { source: "openfoodfacts", id: "1234567", servings: 1 },
            { source: "openfoodfacts", id: "1234567890123456" },
            { source: "openfoodfacts", id: BARCODE },
            { source: "openfoodfacts", id: BARCODE, servings: 1, amount_g: 30 },
            { source: "openfoodfacts", id: BARCODE, servings: 21 },
            { source: "openfoodfacts", id: BARCODE, servings: Number.NaN },
        ];
        for (const raw of bad) expectRefused(() => parseFoodRef(raw));
    });

    test("assertFoodRefPlacement refuses a meal-level ref beside items", () => {
        expectRefused(() => assertFoodRefPlacement(true, true));
        expect(() => assertFoodRefPlacement(true, false)).not.toThrow();
        expect(() => assertFoodRefPlacement(false, true)).not.toThrow();
    });
});

describe("referenceFromFood and referenceFromUsda", () => {
    const food = (over: Partial<FoodResult> = {}): FoodResult => ({
        name: "Cola",
        brand: null,
        serving: "330 ml",
        calories: 139,
        protein_g: 0,
        carbs_g: 35,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 35,
        alcohol_g: null,
        nutriscore_grade: null,
        nova_group: null,
        source: `off:${BARCODE}`,
        source_name: "openfoodfacts",
        barcode: BARCODE,
        ...over,
    });

    test("a labelled serving is per serving", () => {
        const ref = referenceFromFood(food(), BARCODE, null);
        expect(ref?.basis).toBe("per_serving");
        expect(ref?.values.calories).toBe(139);
    });

    test("the '100 g' serving label is per 100 g", () => {
        expect(
            referenceFromFood(food({ serving: "100 g" }), BARCODE, null)?.basis,
        ).toBe("per_100g");
    });

    test("no serving label means no usable record", () => {
        expect(
            referenceFromFood(food({ serving: null }), BARCODE, null),
        ).toBeNull();
    });

    test("a payload from before added sugar verifies the rest and leaves added sugar unverified", () => {
        // A FoodResult cached before added_sugar_g existed: the key is absent.
        const legacy = food({ serving: "100 g" });
        delete (legacy as Partial<FoodResult>).added_sugar_g;
        const rec = referenceFromFood(legacy, BARCODE, null)!;
        const out = resolveNutrientSources({
            values: { calories: 139, sugar_g: 35, added_sugar_g: 12 },
            ref: {
                ref: { source: "openfoodfacts", id: BARCODE, amount_g: 100 },
                record: rec,
            },
        });
        expect(out.sources.calories).toEqual({
            s: "openfoodfacts",
            ref: BARCODE,
        });
        expect(out.sources.sugar_g).toEqual({
            s: "openfoodfacts",
            ref: BARCODE,
        });
        expect(out.sources.added_sugar_g).toEqual({ s: "estimate" });
    });

    test("an OFF '~' added sugar is estimate, not openfoodfacts", () => {
        const estimated = food({
            serving: "100 g",
            added_sugar_g: 12,
            added_sugar_estimated: true,
        });
        const rec = referenceFromFood(estimated, BARCODE, null)!;
        const out = resolveNutrientSources({
            values: { sugar_g: 35, added_sugar_g: 12 },
            ref: {
                ref: { source: "openfoodfacts", id: BARCODE, amount_g: 100 },
                record: rec,
            },
        });
        expect(out.sources.added_sugar_g).toEqual({ s: "estimate" });
        expect(out.sources.sugar_g?.s).toBe("openfoodfacts");
    });

    test("usda records carry the fdc id, the data type and per-100 g values", () => {
        const record = usdaRecordFromPayload({
            fdc_id: 171477,
            name: "Chicken",
            data_type: "SR Legacy",
            per100g: { calories: 165, protein_g: 31 },
            portions: [{ label: "1 cup", grams: 140 }],
        })!;
        const ref = referenceFromUsda(record, "2026-10-01T00:00:00.000Z");
        expect(ref).toMatchObject({
            source: "usda",
            id: "171477",
            data_type: "SR Legacy",
            basis: "per_100g",
        });
        expect(usdaSourceId(171477)).toBe("171477");
    });
});

describe("resolveNutrientSources: precedence", () => {
    const values: LoggedValues = { calories: 200, fiber_g: 3, caffeine_mg: 0 };

    test("a cache miss labels every value estimate and writes no detail", () => {
        const out = resolveNutrientSources({
            values,
            ref: {
                ref: usdaRef(100),
                record: null,
            },
        });
        expect(out.sources).toEqual({
            calories: { s: "estimate" },
            fiber_g: { s: "estimate" },
            caffeine_mg: { s: "estimate" },
        });
        expect(out.detail).toBeNull();
    });

    test("no ref at all is estimate for every value", () => {
        const out = resolveNutrientSources({ values });
        expect(
            Object.values(out.sources).every((t) => t?.s === "estimate"),
        ).toBe(true);
    });

    test("a verified record beats user_stated, user_stated beats estimate", () => {
        const record = usda({ calories: 200, fiber_g: 9 });
        const out = resolveNutrientSources({
            values,
            ref: { ref: usdaRef(100), record },
            userStated: ["calories", "fiber_g", "caffeine_mg"],
        });
        // calories verifies: the record wins over user_stated.
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
        // fiber 3 g vs record 9 g: does not verify, so the user's figure stands.
        expect(out.sources.fiber_g).toEqual({ s: "user" });
        expect(out.sources.caffeine_mg).toEqual({ s: "user" });
    });

    test("null values get no entry", () => {
        const out = resolveNutrientSources({
            values: { calories: 200, fiber_g: null },
        });
        expect(out.sources).toEqual({ calories: { s: "estimate" } });
    });

    test("a verified tag writes its detail: name, data type and grams", () => {
        const out = resolveNutrientSources({
            values: { calories: 300 },
            ref: { ref: usdaRef(150), record: usda({ calories: 200 }) },
        });
        expect(out.detail).toEqual({
            [`usda:${FDC}`]: {
                name: "Chicken, breast, meat only, cooked, grilled",
                data_type: "SR Legacy",
                amount_g: 150,
                fetched_at: "2026-10-01T00:00:00.000Z",
            },
        });
    });

    test("a record name is cut to the stored length", () => {
        const out = resolveNutrientSources({
            values: { calories: 200 },
            ref: {
                ref: usdaRef(100),
                record: usda({ calories: 200 }, { name: "x".repeat(500) }),
            },
        });
        expect(out.detail![`usda:${FDC}`]!.name).toHaveLength(
            MAX_SOURCE_NAME_CHARS,
        );
    });

    test("a per-serving record writes servings, not grams", () => {
        const off = usda(
            { calories: 139 },
            {
                source: "openfoodfacts",
                id: BARCODE,
                basis: "per_serving",
                name: "Cola",
                data_type: null,
            },
        );
        const out = resolveNutrientSources({
            values: { calories: 278 },
            ref: {
                ref: { source: "openfoodfacts", id: BARCODE, servings: 2 },
                record: off,
            },
        });
        expect(out.sources.calories).toEqual({
            s: "openfoodfacts",
            ref: BARCODE,
        });
        expect(out.detail![`openfoodfacts:${BARCODE}`]).toMatchObject({
            name: "Cola",
            servings: 2,
        });
        expect(
            out.detail![`openfoodfacts:${BARCODE}`]!.amount_g,
        ).toBeUndefined();
    });

    test("a basis mismatch is refused when the record is present", () => {
        expectRefused(() =>
            resolveNutrientSources({
                values: { calories: 200 },
                ref: {
                    ref: { source: "usda", id: FDC, amount_g: 100 },
                    record: usda({ calories: 200 }, { basis: "per_serving" }),
                },
            }),
        );
    });
});

describe("mergeProvenance (update_meal on a plain meal)", () => {
    const oldValues: LoggedValues = { calories: 200, fiber_g: 3, sugar_g: 5 };
    const oldSources: NutrientSources = {
        calories: { s: "usda", ref: FDC },
        fiber_g: { s: "estimate" },
        sugar_g: { s: "estimate" },
    };
    const oldDetail: SourceDetail = {
        [`usda:${FDC}`]: { name: "Chicken" },
    };

    test("a changed nutrient takes its fresh tag, unchanged ones keep theirs", () => {
        const newValues: LoggedValues = {
            calories: 200,
            fiber_g: 4,
            sugar_g: 5,
        };
        const changed = resolveNutrientSources({
            values: { fiber_g: 4 },
            userStated: ["fiber_g"],
        });
        const out = mergeProvenance({
            oldValues,
            newValues,
            oldSources,
            oldDetail,
            changed,
        });
        expect(out.sources).toEqual({
            calories: { s: "usda", ref: FDC },
            fiber_g: { s: "user" },
            sugar_g: { s: "estimate" },
        });
    });

    test("a changed nutrient with no fresh tag loses its label", () => {
        const out = mergeProvenance({
            oldValues,
            newValues: { calories: 200, fiber_g: 4, sugar_g: 5 },
            oldSources,
            oldDetail,
            changed: { sources: {}, detail: null },
        });
        expect(out.sources.fiber_g).toBeUndefined();
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
    });

    test("a nutrient set to null loses its entry", () => {
        const out = mergeProvenance({
            oldValues,
            newValues: { calories: 200, fiber_g: null, sugar_g: 5 },
            oldSources,
            oldDetail,
            changed: { sources: {}, detail: null },
        });
        expect(out.sources.fiber_g).toBeUndefined();
    });

    test("a legacy row's untagged nutrient stays untagged when unchanged", () => {
        const out = mergeProvenance({
            oldValues,
            newValues: { calories: 200, fiber_g: 3, sugar_g: 9 },
            oldSources: { calories: { s: "usda", ref: FDC } },
            oldDetail,
            changed: {
                sources: { sugar_g: { s: "estimate" } },
                detail: null,
            },
        });
        expect(out.sources).toEqual({
            calories: { s: "usda", ref: FDC },
            sugar_g: { s: "estimate" },
        });
    });

    test("detail keeps only the records the surviving tags point at", () => {
        const out = mergeProvenance({
            oldValues,
            newValues: { calories: null, fiber_g: 3, sugar_g: 5 },
            oldSources,
            oldDetail: {
                [`usda:${FDC}`]: { name: "Chicken" },
                "openfoodfacts:5449000000996": { name: "Cola" },
            },
            changed: { sources: {}, detail: null },
        });
        expect(out.detail).toBeNull();
    });
});

describe("deriveMealProvenance (items)", () => {
    const usdaTag = (ref: string) => ({ s: "usda" as const, ref });

    test("the meal total is labelled with the source that carries it when all items agree", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 100 },
                sources: { calories: usdaTag(FDC) },
            },
            {
                values: { calories: 50 },
                sources: { calories: usdaTag(FDC) },
            },
        ]);
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
    });

    test("different sources give a mixed label with value-weighted whole-percent parts", () => {
        const out = deriveMealProvenance([
            { values: { calories: 100 }, sources: { calories: usdaTag(FDC) } },
            {
                values: { calories: 300 },
                sources: { calories: { s: "estimate" } },
            },
        ]);
        expect(out.sources.calories).toEqual({
            s: "mixed",
            parts: [
                { s: "estimate", share: 75 },
                { s: "usda", share: 25 },
            ],
        });
    });

    test("parts sum to 100 even when the raw shares do not divide evenly", () => {
        const out = deriveMealProvenance([
            { values: { fat_g: 1 }, sources: { fat_g: usdaTag(FDC) } },
            { values: { fat_g: 1 }, sources: { fat_g: { s: "estimate" } } },
            { values: { fat_g: 1 }, sources: { fat_g: { s: "user" } } },
        ]);
        const tag = out.sources.fat_g;
        expect(tag?.s).toBe("mixed");
        const parts = tag && tag.s === "mixed" ? tag.parts : [];
        expect(parts.reduce((a, p) => a + p.share, 0)).toBe(100);
        expect(parts.map((p) => p.share).sort((a, b) => b - a)).toEqual([
            34, 33, 33,
        ]);
    });

    test("nulls are skipped: an item without the value does not dilute the share", () => {
        const out = deriveMealProvenance([
            { values: { fiber_g: 4 }, sources: { fiber_g: usdaTag(FDC) } },
            { values: { fiber_g: null }, sources: null },
        ]);
        expect(out.sources.fiber_g).toEqual({ s: "usda", ref: FDC });
    });

    test("a nutrient no item carries gets no entry", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 10 },
                sources: { calories: { s: "estimate" } },
            },
        ]);
        expect(out.sources.caffeine_mg).toBeUndefined();
    });

    test("a carrier with no label leaves the total unlabelled", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 10 },
                sources: { calories: { s: "estimate" } },
            },
            { values: { calories: 10 }, sources: null },
        ]);
        expect(out.sources.calories).toBeUndefined();
    });

    test("same source across different records keeps the source, without a record", () => {
        const out = deriveMealProvenance([
            { values: { calories: 100 }, sources: { calories: usdaTag(FDC) } },
            {
                values: { calories: 100 },
                sources: { calories: usdaTag("170000") },
            },
        ]);
        expect(out.sources.calories).toEqual({ s: "usda" });
    });

    test("all-zero carriers count equally", () => {
        const out = deriveMealProvenance([
            { values: { fiber_g: 0 }, sources: { fiber_g: usdaTag(FDC) } },
            { values: { fiber_g: 0 }, sources: { fiber_g: { s: "estimate" } } },
        ]);
        // Equal shares; ties keep the order the sources first appear in.
        expect(out.sources.fiber_g).toEqual({
            s: "mixed",
            parts: [
                { s: "usda", share: 50 },
                { s: "estimate", share: 50 },
            ],
        });
    });

    test("the meal's detail is the union of its items' detail, pruned to its tags", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 10 },
                sources: { calories: usdaTag(FDC) },
                detail: { [`usda:${FDC}`]: { name: "Chicken" } },
            },
            {
                values: { calories: 10 },
                sources: { calories: usdaTag(FDC) },
                detail: { "usda:999": { name: "Unused" } },
            },
        ]);
        expect(Object.keys(out.detail ?? {})).toEqual([`usda:${FDC}`]);
    });

    test("a mixed total names no record, so its items' detail is not kept on the meal", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 10 },
                sources: { calories: usdaTag(FDC) },
                detail: { [`usda:${FDC}`]: { name: "Chicken" } },
            },
            {
                values: { calories: 10 },
                sources: { calories: { s: "estimate" } },
            },
        ]);
        expect(out.sources.calories?.s).toBe("mixed");
        expect(out.detail).toBeNull();
    });
});

describe("parseNutrientSources and parseSourceDetail", () => {
    test("a valid map round-trips", () => {
        const map: NutrientSources = {
            calories: { s: "usda", ref: FDC },
            fiber_g: { s: "estimate" },
            caffeine_mg: { s: "user" },
            sugar_g: {
                s: "mixed",
                parts: [
                    { s: "usda", share: 60 },
                    { s: "estimate", share: 40 },
                ],
            },
        };
        expect(parseNutrientSources(JSON.parse(JSON.stringify(map)))).toEqual(
            map,
        );
    });

    test("legacy and non-object values read as null", () => {
        expect(parseNutrientSources(null)).toBeNull();
        expect(parseNutrientSources(undefined)).toBeNull();
        expect(parseNutrientSources([])).toBeNull();
        expect(parseNutrientSources("usda")).toBeNull();
        expect(parseNutrientSources({})).toBeNull();
    });

    test("bad entries are dropped, good ones kept", () => {
        const parsed = parseNutrientSources({
            calories: { s: "usda", ref: FDC },
            protein_g: { s: "web" },
            fat_g: { s: "usda", ref: "not-digits" },
            carbs_g: { s: "user", ref: FDC },
            fiber_g: { s: "estimate" },
            not_a_nutrient: { s: "estimate" },
        });
        expect(parsed).toEqual({
            calories: { s: "usda", ref: FDC },
            fiber_g: { s: "estimate" },
        });
    });

    test("a mixed tag whose shares do not total 100 is dropped", () => {
        expect(
            parseNutrientSources({
                calories: { s: "mixed", parts: [{ s: "usda", share: 60 }] },
            }),
        ).toBeNull();
    });

    test("source_detail keeps only well-formed keys and entries", () => {
        const parsed = parseSourceDetail({
            [`usda:${FDC}`]: {
                name: "Chicken",
                amount_g: 150,
                data_type: "SR Legacy",
            },
            [`openfoodfacts:${BARCODE}`]: { name: "Cola", servings: 2 },
            "web:1": { name: "Nope" },
            "usda:abc": { name: "Nope" },
            [`usda:${FDC}x`]: { name: "Nope" },
            "usda:170000": { amount_g: 10 },
            "usda:170001": { name: "Bad grams", amount_g: -3 },
        });
        expect(Object.keys(parsed ?? {}).sort()).toEqual(
            [`usda:${FDC}`, `openfoodfacts:${BARCODE}`, "usda:170001"].sort(),
        );
        expect(parsed![`usda:170001`]).toEqual({ name: "Bad grams" });
    });

    test("source_detail with nothing valid reads as null", () => {
        expect(parseSourceDetail(null)).toBeNull();
        expect(parseSourceDetail({ "web:1": { name: "x" } })).toBeNull();
    });
});

describe("widget _meta and the model line", () => {
    const detail: SourceDetail = {
        [`usda:${FDC}`]: {
            name: "x".repeat(120),
            data_type: "SR Legacy",
            amount_g: 150,
        },
    };
    const sources: NutrientSources = {
        calories: { s: "usda", ref: FDC },
        alcohol_g: { s: "estimate" },
        fiber_g: { s: "estimate" },
    };

    test("names are cut to 60 characters with an ellipsis and amounts are dropped", () => {
        const meta = metaFor(sources, detail, true)!;
        expect(meta.calories).toEqual({
            s: "usda",
            ref: FDC,
            name: `${"x".repeat(META_NAME_CHARS - 1)}…`,
            data_type: "SR Legacy",
        });
    });

    test("the alcohol gate drops alcohol labels when tracking is off", () => {
        expect(metaFor(sources, detail, false)!.alcohol_g).toBeUndefined();
        expect(metaFor(sources, detail, true)!.alcohol_g).toEqual({
            s: "estimate",
        });
    });

    test("null when there is nothing to send", () => {
        expect(metaFor(null, null, true)).toBeNull();
        expect(
            metaFor({ alcohol_g: { s: "estimate" } }, null, false),
        ).toBeNull();
    });

    test("buildNutrientSourcesMeta aligns meals and items by position", () => {
        const itemSources: NutrientSources = { calories: { s: "estimate" } };
        const meta = buildNutrientSourcesMeta(
            [{ id: "m1" }, { id: "m2" }, { id: "m3" }],
            new Map([
                ["m1", { sources, detail }],
                ["m2", { sources: null, detail: null }],
                ["m3", { sources: null, detail: null }],
            ]),
            new Map([
                [
                    "m1",
                    [
                        { nutrient_sources: itemSources },
                        { nutrient_sources: null },
                    ],
                ],
                ["m3", [{ nutrient_sources: itemSources }]],
            ]),
            true,
        );
        expect(meta?.v).toBe(1);
        expect(meta?.meals[0]).toMatchObject({
            meal: { calories: { s: "usda", ref: FDC } },
            items: [{ calories: { s: "estimate" } }, null],
        });
        expect(meta?.meals[1]).toBeNull();
        expect(meta?.meals[2]).toEqual({
            meal: null,
            items: [{ calories: { s: "estimate" } }],
        });
    });

    test("buildNutrientSourcesMeta is null when no row carries a label", () => {
        expect(
            buildNutrientSourcesMeta(
                [{ id: "m1" }],
                new Map(),
                new Map(),
                true,
            ),
        ).toBeNull();
    });

    test("formatSourcesLine names the record and the amount, and says match, not verified", () => {
        const line = formatSourcesLine(
            {
                calories: { s: "usda", ref: FDC },
                protein_g: { s: "usda", ref: FDC },
                fiber_g: { s: "estimate" },
                sugar_g: { s: "estimate" },
            },
            detail,
            { refSent: true },
        );
        expect(line).toBe(
            "Sources: calories, protein match USDA FoodData Central 171477 for 150 g; fiber, sugar estimated.",
        );
        expect(line).not.toContain("verified");
    });

    test("an all-estimate row says nothing unless a ref was sent", () => {
        const all: NutrientSources = { calories: { s: "estimate" } };
        expect(formatSourcesLine(all, null, { refSent: false })).toBeNull();
        expect(formatSourcesLine(all, null, { refSent: true })).toBe(
            "Sources: all values estimated.",
        );
    });

    test("user and OFF tags read in words", () => {
        const line = formatSourcesLine(
            {
                caffeine_mg: { s: "user" },
                calories: { s: "openfoodfacts", ref: BARCODE },
            },
            {
                [`openfoodfacts:${BARCODE}`]: { name: "Cola", servings: 1 },
            },
            { refSent: true },
        );
        expect(line).toBe(
            "Sources: calories match Open Food Facts barcode 5449000000996 for 1 serving; caffeine from your figures.",
        );
    });

    test("no sources means no line", () => {
        expect(formatSourcesLine(null, null, { refSent: true })).toBeNull();
    });
});

describe("record amounts stay with their uses", () => {
    test("an unchanged tag on a record the fresh detail sets to another amount becomes estimate", () => {
        const out = mergeProvenance({
            oldValues: { calories: 150, protein_g: 30 },
            newValues: { calories: 200, protein_g: 30 },
            oldSources: {
                calories: { s: "usda", ref: FDC },
                protein_g: { s: "usda", ref: FDC },
            },
            oldDetail: { [`usda:${FDC}`]: { name: "Chicken", amount_g: 150 } },
            changed: {
                sources: { calories: { s: "usda", ref: FDC } },
                detail: {
                    [`usda:${FDC}`]: { name: "Chicken", amount_g: 200 },
                },
            },
        });
        // Protein was matched for 150 g; the record now names 200 g.
        expect(out.sources.protein_g).toEqual({ s: "estimate" });
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
        expect(out.detail).toEqual({
            [`usda:${FDC}`]: { name: "Chicken", amount_g: 200 },
        });
    });

    test("an unchanged tag on the same record at the same amount keeps its tag", () => {
        const out = mergeProvenance({
            oldValues: { calories: 150, protein_g: 30 },
            newValues: { calories: 160, protein_g: 30 },
            oldSources: {
                calories: { s: "usda", ref: FDC },
                protein_g: { s: "usda", ref: FDC },
            },
            oldDetail: { [`usda:${FDC}`]: { name: "Chicken", amount_g: 150 } },
            changed: {
                sources: { calories: { s: "usda", ref: FDC } },
                detail: {
                    [`usda:${FDC}`]: { name: "Chicken", amount_g: 150 },
                },
            },
        });
        expect(out.sources.protein_g).toEqual({ s: "usda", ref: FDC });
    });

    test("one record at two amounts across items: the meal's detail drops the amount", () => {
        const usdaTag = { s: "usda" as const, ref: FDC };
        const out = deriveMealProvenance([
            {
                values: { calories: 165 },
                sources: { calories: usdaTag },
                detail: {
                    [`usda:${FDC}`]: { name: "Chicken", amount_g: 100 },
                },
            },
            {
                values: { calories: 82.5 },
                sources: { calories: usdaTag },
                detail: {
                    [`usda:${FDC}`]: { name: "Chicken", amount_g: 50 },
                },
            },
        ]);
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
        expect(out.detail).toEqual({ [`usda:${FDC}`]: { name: "Chicken" } });
    });

    test("a single item's record keeps its amount on the meal", () => {
        const out = deriveMealProvenance([
            {
                values: { calories: 165 },
                sources: { calories: { s: "usda", ref: FDC } },
                detail: {
                    [`usda:${FDC}`]: { name: "Chicken", amount_g: 100 },
                },
            },
            {
                values: { fiber_g: 3 },
                sources: { fiber_g: { s: "estimate" } },
            },
        ]);
        expect(out.sources.calories).toEqual({ s: "usda", ref: FDC });
        expect(out.detail).toEqual({
            [`usda:${FDC}`]: { name: "Chicken", amount_g: 100 },
        });
    });

    test("scaleSourceDetail scales the amounts and keeps the rest; factor 1 is unchanged", () => {
        const detail: SourceDetail = {
            [`usda:${FDC}`]: {
                name: "Chicken",
                data_type: "SR Legacy",
                amount_g: 100,
                fetched_at: "2026-10-01T00:00:00.000Z",
            },
            [`openfoodfacts:${BARCODE}`]: { name: "Yogurt", servings: 1 },
        };
        expect(scaleSourceDetail(detail, 1)).toBe(detail);
        expect(scaleSourceDetail(detail, 2.5)).toEqual({
            [`usda:${FDC}`]: {
                name: "Chicken",
                data_type: "SR Legacy",
                amount_g: 250,
                fetched_at: "2026-10-01T00:00:00.000Z",
            },
            [`openfoodfacts:${BARCODE}`]: { name: "Yogurt", servings: 2.5 },
        });
        expect(scaleSourceDetail(null, 2)).toBeNull();
    });

    test("a '100 g' serving record takes servings, one serving being 100 g", () => {
        const rec = usda({}, { serving_is_100g: true });
        expect(
            basisFactor(
                { source: "openfoodfacts", id: BARCODE, servings: 2 },
                rec,
            ),
        ).toBe(2);
        expect(basisFactor(usdaRef(50), rec)).toBeCloseTo(0.5, 10);
    });

    test("a per-100 g record without the '100 g' serving flag still refuses servings", () => {
        expectRefused(() =>
            basisFactor(
                { source: "openfoodfacts", id: BARCODE, servings: 2 },
                usda({}),
            ),
        );
    });

    test("parseNutrientSources keeps a record-backed tag that names no record", () => {
        expect(parseNutrientSources({ calories: { s: "usda" } })).toEqual({
            calories: { s: "usda" },
        });
        expect(
            parseNutrientSources({ calories: { s: "usda", ref: "abc" } }),
        ).toBeNull();
    });

    test("a food_ref refusal that quotes the id logs without it", () => {
        const bad = expectRefused(() =>
            parseFoodRef({ source: "usda", id: "12ab", amount_g: 10 }),
        );
        expect(bad.message).toContain("12ab");
        expect(bad.logText).toBeDefined();
        expect(bad.logText).not.toContain("12ab");

        const wrongBasis = expectRefused(() =>
            basisFactor(
                { source: "openfoodfacts", id: BARCODE, amount_g: 30 },
                usda({}, { basis: "per_serving" }),
            ),
        );
        expect(wrongBasis.message).toContain(BARCODE);
        expect(wrongBasis.logText).not.toContain(BARCODE);
    });
});

describe("formatItemSourcesBlock (per-ingredient model lines)", () => {
    const USDA = { s: "usda", ref: "171477" } as const;
    const detail = {
        "usda:171477": { name: "Chicken", amount_g: 150 },
    };

    test("names the record, its grams, and the estimated nutrients in one line", () => {
        const block = formatItemSourcesBlock([
            {
                name: "chicken breast",
                nutrient_sources: {
                    calories: USDA,
                    protein_g: USDA,
                    carbs_g: USDA,
                    fat_g: USDA,
                    fiber_g: { s: "estimate" },
                    sugar_g: { s: "estimate" },
                },
                source_detail: detail,
            },
        ]);
        expect(block).toBe(
            "Ingredient sources:\n- chicken breast: USDA 171477 (150 g) for calories, protein, carbs, fat; fiber, sugar estimated",
        );
    });

    test("an item with only estimates gets no line; a user-stated item does", () => {
        const block = formatItemSourcesBlock([
            {
                name: "Sauce",
                nutrient_sources: { calories: { s: "estimate" } },
            },
            {
                name: "Honey",
                nutrient_sources: { sugar_g: { s: "user" } },
            },
            { name: "Bare", nutrient_sources: null },
        ]);
        expect(block).toBe(
            "Ingredient sources:\n- Honey: your figures for sugar",
        );
    });

    test("returns null when no item carries a named label", () => {
        expect(formatItemSourcesBlock([])).toBeNull();
        expect(
            formatItemSourcesBlock([
                {
                    name: "A",
                    nutrient_sources: { calories: { s: "estimate" } },
                },
            ]),
        ).toBeNull();
    });

    test("a barcode record and a servings amount read as the product, not a USDA id", () => {
        const block = formatItemSourcesBlock([
            {
                name: "Crisps",
                nutrient_sources: {
                    calories: { s: "openfoodfacts", ref: "5000159484695" },
                },
                source_detail: {
                    "openfoodfacts:5000159484695": {
                        name: "Crisps",
                        servings: 2,
                    },
                },
            },
        ]);
        expect(block).toBe(
            "Ingredient sources:\n- Crisps: Open Food Facts barcode 5000159484695 (2 servings) for calories",
        );
    });

    test("names are flattened to one line and capped", () => {
        const block = formatItemSourcesBlock([
            {
                name: "line one\nline two " + "x".repeat(200),
                nutrient_sources: { protein_g: { s: "user" } },
            },
        ]);
        const lines = block!.split("\n");
        expect(lines).toHaveLength(2);
        expect(lines[1]!.startsWith("- line one line two ")).toBe(true);
        expect(lines[1]!.length).toBeLessThan(140);
    });
});
