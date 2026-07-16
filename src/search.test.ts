import { test, expect } from "bun:test";
import {
    escapeLikePattern,
    tokenizeQuery,
    groupMealVariations,
    formatMealSearchResults,
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
        notes: null,
        idempotency_key: null,
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
