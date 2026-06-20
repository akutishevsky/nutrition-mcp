import { test, expect } from "bun:test";
import { buildMealsCsv } from "./export.js";
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

const HEADER =
    "id,logged_at,timezone,meal_type,description,calories,protein_g,carbs_g,fat_g,notes";

test("emits a header even with no meals", () => {
    expect(buildMealsCsv([], "UTC")).toBe(HEADER);
});

test("renders timestamps in UTC when tz is UTC", () => {
    const csv = buildMealsCsv([meal()], "UTC");
    const [, row] = csv.split("\n");
    expect(row).toContain("2026-06-20 14:30:00");
    expect(row).toContain("UTC");
});

test("renders timestamps in the user's timezone when set", () => {
    // 14:30 UTC is 16:30 in Berlin (CEST, summer).
    const csv = buildMealsCsv([meal()], "Europe/Berlin");
    const [, row] = csv.split("\n");
    expect(row).toContain("2026-06-20 16:30:00");
    expect(row).toContain("Europe/Berlin");
});

test("leaves null macros and notes as empty fields", () => {
    const csv = buildMealsCsv(
        [
            meal({
                calories: null,
                protein_g: null,
                carbs_g: null,
                fat_g: null,
                notes: null,
            }),
        ],
        "UTC",
    );
    const row = csv.split("\n")[1]!;
    // trailing empty notes + empty macros
    expect(row.endsWith(",,,,,")).toBe(true);
});

test("quotes and escapes fields containing commas, quotes, and newlines", () => {
    const csv = buildMealsCsv(
        [
            meal({
                description: 'Salad, "the big one"',
                notes: "line1\nline2",
            }),
        ],
        "UTC",
    );
    const row = csv.split("\n").slice(1).join("\n");
    expect(row).toContain('"Salad, ""the big one"""');
    expect(row).toContain('"line1\nline2"');
});
