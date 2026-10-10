import { test, expect, describe } from "bun:test";
import {
    escapeLikePattern,
    tokenizeQuery,
    groupMealVariations,
    formatMealSearchResults,
    formatSavedMealMatches,
    type SavedMealSummary,
} from "./search.js";
import type { Meal } from "./supabase.js";

function meal(overrides: Partial<Meal> = {}): Meal {
    return {
        id: "11111111-1111-1111-1111-111111111111",
        user_id: "user-1",
        logged_at: "2026-06-20T14:30:00.000Z",
        meal_type: "lunch",
        description: "Grilled chicken",
        calories: 500,
        protein_g: 40,
        carbs_g: 10,
        fat_g: 20,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        ...overrides,
    };
}

// --- escapeLikePattern ---

test("escapes LIKE metacharacters", () => {
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\");
});

test("leaves plain text untouched", () => {
    expect(escapeLikePattern("oatmeal with banana")).toBe(
        "oatmeal with banana",
    );
});

// --- tokenizeQuery ---

test("splits on whitespace, lowercases, drops empties", () => {
    expect(tokenizeQuery("  Chicken   SALAD ")).toEqual(["chicken", "salad"]);
});

test("caps at 5 tokens", () => {
    expect(tokenizeQuery("a b c d e f g")).toEqual(["a", "b", "c", "d", "e"]);
});

test("returns empty array for blank query", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
});

// --- groupMealVariations ---

test("merges case, whitespace, and trailing-punctuation variants", () => {
    const variations = groupMealVariations([
        meal({ id: "a", description: "Oatmeal with raisins" }),
        meal({ id: "b", description: "oatmeal  with raisins." }),
        meal({ id: "c", description: " OATMEAL WITH RAISINS " }),
    ]);
    expect(variations).toHaveLength(1);
    expect(variations[0]!.count).toBe(3);
});

test("keeps distinct descriptions as distinct groups", () => {
    const variations = groupMealVariations([
        meal({ id: "a", description: "Oatmeal with raisins" }),
        meal({ id: "b", description: "Oatmeal with banana" }),
    ]);
    expect(variations).toHaveLength(2);
});

test("sorts by count desc, ties broken by recency", () => {
    const variations = groupMealVariations([
        meal({
            id: "a",
            description: "Oatmeal with banana",
            logged_at: "2026-06-01T08:00:00.000Z",
        }),
        meal({
            id: "b",
            description: "Oatmeal with raisins",
            logged_at: "2026-06-02T08:00:00.000Z",
        }),
        meal({
            id: "c",
            description: "Oatmeal with raisins",
            logged_at: "2026-06-03T08:00:00.000Z",
        }),
        meal({
            id: "d",
            description: "Oatmeal with honey",
            logged_at: "2026-06-04T08:00:00.000Z",
        }),
    ]);
    expect(variations.map((v) => v.label)).toEqual([
        "Oatmeal with raisins",
        "Oatmeal with honey",
        "Oatmeal with banana",
    ]);
});

test("label and lastLoggedAt come from the newest entry in the group", () => {
    const variations = groupMealVariations([
        meal({
            id: "a",
            description: "oatmeal with raisins",
            logged_at: "2026-06-01T08:00:00.000Z",
        }),
        meal({
            id: "b",
            description: "Oatmeal with raisins",
            logged_at: "2026-06-05T08:00:00.000Z",
        }),
    ]);
    expect(variations[0]!.label).toBe("Oatmeal with raisins");
    expect(variations[0]!.lastLoggedAt).toBe("2026-06-05T08:00:00.000Z");
});

test("typical macros are medians of non-null values", () => {
    const variations = groupMealVariations([
        meal({ id: "a", calories: 300, protein_g: 10 }),
        meal({ id: "b", calories: 350, protein_g: 12.4 }),
        meal({ id: "c", calories: 900, protein_g: null }),
    ]);
    // odd count → middle value
    expect(variations[0]!.typicalCalories).toBe(350);
    // nulls excluded, even count → average, rounded to 1 decimal
    expect(variations[0]!.typicalProteinG).toBe(11.2);
});

test("all-null macros yield null", () => {
    const variations = groupMealVariations([
        meal({ id: "a", calories: null, protein_g: null }),
        meal({ id: "b", calories: null, protein_g: null }),
    ]);
    expect(variations[0]!.typicalCalories).toBeNull();
    expect(variations[0]!.typicalProteinG).toBeNull();
});

// --- formatMealSearchResults ---

test("renders counts, typical macros, and last-logged date", () => {
    const text = formatMealSearchResults(
        [
            meal({
                id: "b",
                description: "Oatmeal with raisins",
                logged_at: "2026-06-05T08:00:00.000Z",
                calories: 350,
            }),
            meal({
                id: "a",
                description: "Oatmeal with raisins",
                logged_at: "2026-06-01T08:00:00.000Z",
                calories: 350,
            }),
        ],
        ["oatmeal"],
        "UTC",
    );
    expect(text).toContain('Found 2 past meals matching "oatmeal".');
    expect(text).toContain("logged 2×, last on 2026-06-05");
    expect(text).toContain("~350 kcal");
});

test("renders header with all query alternatives", () => {
    const text = formatMealSearchResults(
        [meal({ description: "Вівсянка з бананом" })],
        ["oatmeal", "вівсянка"],
        "UTC",
    );
    expect(text).toContain('matching "oatmeal" / "вівсянка".');
});

test("renders last-logged date in the user's timezone", () => {
    // 23:30 UTC on the 20th is already the 21st in Berlin (CEST, summer).
    const text = formatMealSearchResults(
        [meal({ logged_at: "2026-06-20T23:30:00.000Z" })],
        ["chicken"],
        "Europe/Berlin",
    );
    expect(text).toContain("last on 2026-06-21");
    expect(text).toContain("- 2026-06-21 lunch:");
});

test("caps variations and reports the hidden count", () => {
    const meals = Array.from({ length: 4 }, (_, i) =>
        meal({
            id: `id-${i}`,
            description: `Dish ${i}`,
            logged_at: `2026-06-0${i + 1}T08:00:00.000Z`,
        }),
    ).reverse();
    const text = formatMealSearchResults(meals, ["dish"], "UTC", {
        maxVariations: 2,
        recentCount: 5,
    });
    expect(text).toContain("(…and 2 more variations)");
    expect(text).not.toContain("3. ");
});

test("caps recent entries and includes ids", () => {
    const meals = Array.from({ length: 4 }, (_, i) =>
        meal({
            id: `id-${i}`,
            description: "Same dish",
            logged_at: `2026-06-0${i + 1}T08:00:00.000Z`,
        }),
    ).reverse();
    const text = formatMealSearchResults(meals, ["dish"], "UTC", {
        recentCount: 2,
    });
    expect(text).toContain("[id: id-3]");
    expect(text).toContain("[id: id-2]");
    expect(text).not.toContain("[id: id-1]");
});

test("renders '(no macros logged)' when every entry lacks macros", () => {
    const text = formatMealSearchResults(
        [
            meal({
                calories: null,
                protein_g: null,
                carbs_g: null,
                fat_g: null,
            }),
        ],
        ["soup"],
        "UTC",
    );
    expect(text).toContain("(no macros logged)");
    expect(text).not.toContain("~null");
});

// --- fiber / sugar / caffeine in the variation line ---
//
// The model is told to search before logging a repeat, so anything this output
// leaves out is what it re-derives or forgets every time. Showing only kcal and
// P/C/F was itself teaching that a meal is four numbers.

test("a variation carries fiber, sugar and caffeine when the history has them", () => {
    const text = formatMealSearchResults(
        [
            meal({ description: "Flat white", fiber_g: 0, sugar_g: 9 }),
            meal({ description: "Flat white", fiber_g: 0, sugar_g: 11 }),
        ].map((m) => ({ ...m, caffeine_mg: 95 })),
        ["flat white"],
        "UTC",
    );
    expect(text).toContain("0g fiber");
    expect(text).toContain("10g sugar");
    expect(text).toContain("95 mg caffeine");
});

// Added sugar is part of the total, so it is a bracket on the sugar figure
// rather than an amount of its own.
test("a variation shows added sugar inside its sugar figure", () => {
    const text = formatMealSearchResults(
        [
            meal({ description: "Cola", sugar_g: 35, added_sugar_g: 35 }),
            meal({ description: "Cola", sugar_g: 35, added_sugar_g: null }),
        ],
        ["cola"],
        "UTC",
    );
    expect(text).toContain("35g sugar (35g added)");
});

test("added sugar is left out when no entry recorded it", () => {
    const [v] = groupMealVariations([
        meal({ description: "Banana", sugar_g: 14 }),
    ]);
    expect(v?.typicalAddedSugarG).toBeNull();
    const text = formatMealSearchResults(
        [meal({ description: "Banana", sugar_g: 14 })],
        ["banana"],
        "UTC",
    );
    expect(text).toContain("14g sugar)");
    expect(text).not.toContain("added");
});

test("added sugar with no total recorded still shows", () => {
    const text = formatMealSearchResults(
        [meal({ description: "Syrup", sugar_g: null, added_sugar_g: 10 })],
        ["syrup"],
        "UTC",
    );
    expect(text).toContain("10g added sugar");
});

// Median over the entries that HAVE the field, so a history where fiber was
// only recorded sometimes still surfaces the figure rather than dropping it.
test("mixed history reports the typical value of the entries that recorded one", () => {
    const [a, b] = groupMealVariations([
        meal({ description: "Porridge", fiber_g: 8 }),
        meal({ description: "Porridge", fiber_g: null }),
        meal({ description: "Steak", sugar_g: null, fiber_g: null }),
    ]);
    expect(a?.typicalFiberG).toBe(8);
    expect(b?.typicalFiberG).toBeNull();
});

// A null is absence, and the line must not claim a zero for it — that is the
// same null-vs-zero rule the read side is built on.
test("a nutrient nobody recorded is left out of the line entirely", () => {
    const text = formatMealSearchResults(
        [meal({ description: "Grilled chicken" })],
        ["chicken"],
        "UTC",
    );
    const line = text.split("\n").find((l) => l.startsWith("1. "))!;
    expect(line).not.toContain("fiber");
    expect(line).not.toContain("caffeine");
    // …and the closing instruction tells the model to fill it in this time.
    expect(text).toContain("missing data rather than a zero");
});

test("nutrients still show when the calorie figure is the missing one", () => {
    const text = formatMealSearchResults(
        [meal({ description: "Side salad", calories: null, fiber_g: 4 })],
        ["salad"],
        "UTC",
    );
    expect(text).toContain("4g fiber");
    expect(text).not.toContain("(no macros logged)");
});

test("typical added sugar never exceeds typical sugar", () => {
    // Older entries carry no added sugar, so separate medians would give
    // sugar 10 and added 25.
    const [v] = groupMealVariations([
        meal({ description: "Cola", sugar_g: 10, added_sugar_g: null }),
        meal({ description: "Cola", sugar_g: 10, added_sugar_g: null }),
        meal({ description: "Cola", sugar_g: 30, added_sugar_g: 25 }),
    ]);
    expect(v?.typicalSugarG).toBe(10);
    expect(v?.typicalAddedSugarG).not.toBeNull();
    expect(v!.typicalAddedSugarG!).toBeLessThanOrEqual(v!.typicalSugarG!);
    const text = formatMealSearchResults(
        [
            meal({ description: "Cola", sugar_g: 10, added_sugar_g: null }),
            meal({ description: "Cola", sugar_g: 10, added_sugar_g: null }),
            meal({ description: "Cola", sugar_g: 30, added_sugar_g: 25 }),
        ],
        ["cola"],
        "UTC",
    );
    expect(text).toContain("10g sugar (10g added)");
    expect(text).not.toContain("25g added");
});

describe("formatSavedMealMatches", () => {
    function saved(over: Partial<SavedMealSummary> = {}): SavedMealSummary {
        return {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Сніданок стандарт",
            description: "Вівсянка з бананом",
            meal_type: "breakfast",
            calories: 420,
            protein_g: 14,
            carbs_g: 62,
            fat_g: 11,
            item_count: 3,
            ...over,
        };
    }

    test("is empty when nothing matched, so it can be appended unconditionally", () => {
        expect(formatSavedMealMatches([], "UTC")).toBe("");
    });

    test("one line per saved meal: name, type, figures, item count and id", () => {
        const text = formatSavedMealMatches(
            [
                saved(),
                saved({
                    id: "x2",
                    name: "Кава",
                    meal_type: null,
                    item_count: 0,
                    calories: null,
                    protein_g: null,
                    carbs_g: null,
                    fat_g: null,
                }),
            ],
            "UTC",
        );
        const lines = text.split("\n");
        expect(lines[0]).toBe("Saved meals matching: 2 found.");
        expect(lines[1]).toBe(
            '- "Сніданок стандарт" breakfast · 420 kcal · P 14 g · C 62 g · F 11 g · 3 items [saved meal id: 22222222-2222-4222-8222-222222222222]',
        );
        expect(lines[2]).toBe('- "Кава" [saved meal id: x2]');
    });

    test("a single item reads singular, and a partly known macro set shows what it has", () => {
        const text = formatSavedMealMatches(
            [saved({ item_count: 1, protein_g: null, fat_g: null })],
            "UTC",
        );
        expect(text).toContain(" · 1 item [saved meal id: ");
        expect(text).toContain("420 kcal · C 62 g · 1 item [");
        expect(text).not.toContain("P 14");
    });

    test("says when the list holds only the first matches by name (C14)", () => {
        const text = formatSavedMealMatches([saved()], "UTC", 26);
        expect(text.split("\n")[0]).toBe(
            "Saved meals matching: 26 found, the first 1 by name shown.",
        );
        expect(formatSavedMealMatches([saved()], "UTC", 1)).toStartWith(
            "Saved meals matching: 1 found.",
        );
    });

    test("a zero figure is data and is shown", () => {
        const text = formatSavedMealMatches(
            [saved({ calories: 0, carbs_g: 0 })],
            "UTC",
        );
        expect(text).toContain("0 kcal · P 14 g · C 0 g");
    });
});
