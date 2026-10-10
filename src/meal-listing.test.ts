import { test, expect, describe } from "bun:test";
import {
    formatMealCompact,
    formatMealFull,
    renderMealListing,
    MEAL_LISTING_MAX_CHARS,
} from "./meal-listing.js";
import type { Meal } from "./supabase.js";
import { validateItems } from "./meal-items.js";

const ID = "00000000-0000-4000-8000-0000000000aa";

function meal(over: Partial<Meal> = {}): Meal {
    return {
        id: ID,
        user_id: "u1",
        logged_at: "2026-01-15T19:05:00.000Z",
        meal_type: "dinner",
        description: "Pasta and a beer",
        calories: 700,
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: 6,
        sugar_g: 12,
        added_sugar_g: null,
        alcohol_g: 14,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        ...over,
    };
}

const OATMEAL = "Oatmeal with banana, walnuts and honey, whole milk";
const NOTE =
    "Made at home with rolled oats soaked overnight; the banana was very ripe, walnuts were a small handful, honey about one teaspoon, milk 3.2% fat, coffee from a stove moka.";
const TYPES = ["breakfast", "snack", "lunch", "snack", "dinner", "snack"];
// Local Kyiv wall clocks; January is UTC+2.
const UTC_TIMES = ["05:30", "08:30", "11:00", "14:00", "17:30", "19:30"];

/** 31 days × 6 meals, the shape of a real month: rotating types, decimal
 *  macros, caffeine only at breakfast, and a long note on every meal. */
function realisticMonth(): Meal[] {
    const out: Meal[] = [];
    for (let d = 1; d <= 31; d++) {
        const day = `2026-01-${String(d).padStart(2, "0")}`;
        for (let i = 0; i < 6; i++) {
            out.push(
                meal({
                    id: crypto.randomUUID(),
                    logged_at: `${day}T${UTC_TIMES[i]}:00.000Z`,
                    meal_type: TYPES[i]!,
                    description: OATMEAL,
                    calories: 412,
                    protein_g: 14.6,
                    carbs_g: 61.3,
                    fat_g: 12.8,
                    fiber_g: 7.4,
                    sugar_g: 21.9,
                    alcohol_g: null,
                    caffeine_mg: i === 0 ? 95 : null,
                    notes: NOTE,
                }),
            );
        }
    }
    return out;
}

const KYIV = "Europe/Kyiv";

describe("compact listing size", () => {
    test("NOTE is the 170-character fixture", () => {
        expect(NOTE.length).toBe(170);
    });

    test("a realistic month fits one compact response, under half of full", () => {
        const meals = realisticMonth();
        const compact = renderMealListing({
            meals,
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: true,
        });
        expect(compact.truncated).toBe(false);
        expect(compact.shownMeals).toBe(186);
        expect(compact.text.length).toBeLessThan(MEAL_LISTING_MAX_CHARS);

        const full = renderMealListing({
            meals,
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: true,
            maxChars: Infinity,
        });
        expect(full.truncated).toBe(false);
        expect(compact.text.length).toBeLessThan(0.5 * full.text.length);
    });

    test("a six-meal day takes under 1,500 characters", () => {
        const day = realisticMonth().slice(0, 6);
        const { text } = renderMealListing({
            meals: day,
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: false,
        });
        expect(text.length).toBeLessThan(1_500);
        expect(text.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(
            6,
        );
    });
});

describe("compact line", () => {
    test("local time, id, no raw instant, no note text", () => {
        const line = formatMealCompact(
            meal({ notes: "secret sauce" }),
            null,
            KYIV,
        );
        expect(line).toContain("21:05");
        expect(line).toContain(`[id: ${ID}]`);
        expect(line).not.toContain("T19:05:00");
        expect(line).not.toContain("Notes:");
        expect(line).not.toContain("secret sauce");
        expect(line).not.toContain("\n");
    });

    test("the notes flag appears only when there are notes", () => {
        expect(formatMealCompact(meal({ notes: "x" }), null, KYIV)).toContain(
            "· notes",
        );
        expect(formatMealCompact(meal(), null, KYIV)).not.toContain("notes");
    });

    test("alcohol is gated exactly like formatMealFull", () => {
        const off = formatMealCompact(meal(), null, KYIV);
        expect(off).not.toContain("alcohol");
        expect(formatMealFull(meal(), null, KYIV)).not.toContain("Alcohol");
        const on = formatMealCompact(meal(), "us", KYIV);
        expect(on).toContain("alcohol 14 g (1.0 US drinks)");
        expect(
            formatMealCompact(meal({ alcohol_g: null }), "us", KYIV),
        ).not.toContain("alcohol");
    });

    test("a measured 0 mg caffeine is shown; null is not", () => {
        expect(
            formatMealCompact(meal({ caffeine_mg: 0 }), null, KYIV),
        ).toContain("caffeine 0 mg");
        expect(formatMealCompact(meal(), null, KYIV)).not.toContain("caffeine");
    });

    test("missing fiber or sugar is omitted, a zero is kept", () => {
        const line = formatMealCompact(
            meal({ fiber_g: null, sugar_g: 0 }),
            null,
            KYIV,
        );
        expect(line).not.toContain("fiber");
        expect(line).toContain("sugar 0");
        expect(line).toContain("P 25 · C 90 · F 20 · sugar 0 g");
    });

    test("added sugar rides on the sugar figure as a bracket", () => {
        const line = formatMealCompact(
            meal({ sugar_g: 18, added_sugar_g: 12 }),
            null,
            KYIV,
        );
        expect(line).toContain(
            "P 25 · C 90 · F 20 · fiber 6 g · sugar 18 g (12 added)",
        );
        expect(line.match(/sugar/g)).toHaveLength(1);
    });

    test("a recorded 0 g added is shown; null keeps today's line", () => {
        expect(
            formatMealCompact(meal({ added_sugar_g: 0 }), null, KYIV),
        ).toContain("sugar 12 g (0 added)");
        const plain = formatMealCompact(meal(), null, KYIV);
        expect(plain).toContain("P 25 · C 90 · F 20 · fiber 6 · sugar 12 g");
        expect(plain).not.toContain("added");
    });

    test("added sugar without a total still shows the figure it has", () => {
        const line = formatMealCompact(
            meal({ sugar_g: null, added_sugar_g: 7 }),
            null,
            KYIV,
        );
        expect(line).toContain("added sugar 7 g");
        expect(line).not.toContain("(7 added)");
    });

    test("a 300-character description is clipped to 200 plus an ellipsis", () => {
        const long = "a".repeat(300);
        const line = formatMealCompact(meal({ description: long }), null, KYIV);
        expect(line).toContain(`${"a".repeat(200)}…`);
        expect(line).not.toContain("a".repeat(201));
    });

    test("full mode never clips", () => {
        const long = "a".repeat(300);
        expect(
            formatMealFull(meal({ description: long }), null, KYIV),
        ).toContain(`Description: ${long}`);
    });
});

describe("full listing", () => {
    test("local time, notes and id on their own lines", () => {
        const { text } = renderMealListing({
            meals: [meal({ notes: "long note" })],
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: false,
        });
        expect(text.startsWith(`Times are local (${KYIV}).`)).toBe(true);
        expect(text).toContain("Time: 2026-01-15 21:05");
        expect(text).toContain("Notes: long note");
        expect(text).toContain(`ID: ${ID}`);
        expect(text).not.toContain("2026-01-15T19:05");
    });

    test("sugar carries its added figure in the same line", () => {
        expect(
            formatMealFull(
                meal({ sugar_g: 18, added_sugar_g: 12 }),
                null,
                KYIV,
            ),
        ).toContain("Sugar: 18g (12g added)");
        const plain = formatMealFull(meal(), null, KYIV);
        expect(plain).toContain("Sugar: 12g");
        expect(plain).not.toContain("added");
        const addedOnly = formatMealFull(
            meal({ sugar_g: null, added_sugar_g: 7 }),
            null,
            KYIV,
        );
        expect(addedOnly).toContain("Added sugar: 7g");
        expect(addedOnly).not.toContain("Sugar: ");
    });

    test("the compact legend is only added when notes exist", () => {
        const opts = {
            tz: KYIV,
            alcohol: null,
            detail: "compact" as const,
            grouped: false,
        };
        expect(
            renderMealListing({ ...opts, meals: [meal({ notes: "n" })] }).text,
        ).toContain('Pass detail: "full"');
        expect(renderMealListing({ ...opts, meals: [meal()] }).text).toBe(
            `Times are local (${KYIV}).\n\n${formatMealCompact(meal(), null, KYIV)}`,
        );
    });

    test("meals are listed in chronological order whatever the input order", () => {
        const late = meal({ id: "late", logged_at: "2026-01-15T19:00:00Z" });
        const early = meal({ id: "early", logged_at: "2026-01-15T06:00:00Z" });
        const { text } = renderMealListing({
            meals: [late, early],
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: false,
        });
        expect(text.indexOf("early")).toBeLessThan(text.indexOf("late"));
    });
});

describe("budget", () => {
    // Two meals a day for ten days: a day is small enough that several fit in
    // 2,000 characters of full mode, so the cut must land on a day boundary.
    function twoADay(): Meal[] {
        const out: Meal[] = [];
        for (let d = 1; d <= 10; d++) {
            const day = `2026-01-${String(d).padStart(2, "0")}`;
            for (const t of ["06:00", "16:00"]) {
                out.push(
                    meal({
                        id: crypto.randomUUID(),
                        logged_at: `${day}T${t}:00.000Z`,
                    }),
                );
            }
        }
        return out;
    }

    test("full mode cuts at a day boundary and says how to continue", () => {
        const r = renderMealListing({
            meals: twoADay(),
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: true,
            maxChars: 2_000,
        });
        expect(r.truncated).toBe(true);
        expect(r.text.length).toBeLessThanOrEqual(2_000);
        expect(r.shownMeals).toBeGreaterThan(0);
        // Whole days only.
        expect(r.shownMeals % 2).toBe(0);
        const daysShown = r.shownMeals / 2;
        expect(r.text.match(/^## /gm)).toHaveLength(daysShown);
        expect(r.text.match(/^ID: /gm)).toHaveLength(r.shownMeals);
        const last = `2026-01-${String(daysShown).padStart(2, "0")}`;
        const next = `2026-01-${String(daysShown + 1).padStart(2, "0")}`;
        expect(r.text).toContain(
            `${r.shownMeals} of 20 meals shown, through ${last}.`,
        );
        expect(r.text).toContain(
            `Call get_meals_by_date_range again with start_date ${next} for the rest.`,
        );
        expect(r.text).toContain('detail: "compact" fits far more per call.');
    });

    test("a single oversized day still shows one meal and the notice", () => {
        const day = realisticMonth().slice(0, 6);
        const r = renderMealListing({
            meals: day,
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: true,
            maxChars: 100,
        });
        expect(r.truncated).toBe(true);
        expect(r.shownMeals).toBe(1);
        expect(r.text.match(/^ID: /gm)).toHaveLength(1);
        expect(r.text).toContain("1 of 6 meals shown, through 2026-01-01.");
        expect(r.text).toContain(
            'Call get_meals_by_date for 2026-01-01 with detail: "compact".',
        );
    });

    // Three days, the first alone over budget: the fallback shows part of the
    // first day, and the notice must still reach day two onward.
    for (const detail of ["compact", "full"] as const) {
        test(`${detail}: an oversized first day still points at the next start_date`, () => {
            const month = realisticMonth().slice(0, 18);
            const firstDay = renderMealListing({
                meals: month.slice(0, 6),
                tz: KYIV,
                alcohol: null,
                detail,
                grouped: true,
                maxChars: Infinity,
            }).text;
            const r = renderMealListing({
                meals: month,
                tz: KYIV,
                alcohol: null,
                detail,
                grouped: true,
                maxChars: Math.floor(firstDay.length * 0.6),
            });
            expect(r.truncated).toBe(true);
            expect(r.shownMeals).toBeGreaterThanOrEqual(1);
            expect(r.shownMeals).toBeLessThan(6);
            expect(r.text).toContain(
                "Call get_meals_by_date_range again with start_date 2026-01-02 for the rest.",
            );
            if (detail === "full") {
                expect(r.text).toContain(
                    'Call get_meals_by_date for 2026-01-01 with detail: "compact".',
                );
            } else {
                expect(r.text).not.toContain("get_meals_by_date for");
            }
        });
    }

    test("a one-meal first day shown whole gets the day-boundary hint only", () => {
        const meals = [1, 2, 3].map((d) =>
            meal({
                id: crypto.randomUUID(),
                logged_at: `2026-01-${String(14 + d).padStart(2, "0")}T10:00:00.000Z`,
                notes: NOTE,
            }),
        );
        for (const detail of ["compact", "full"] as const) {
            const r = renderMealListing({
                meals,
                tz: KYIV,
                alcohol: null,
                detail,
                grouped: true,
                maxChars: 50,
            });
            expect(r.truncated).toBe(true);
            expect(r.shownMeals).toBe(1);
            expect(r.text).toContain("1 of 3 meals shown, through 2026-01-15.");
            expect(r.text).toContain(
                "Call get_meals_by_date_range again with start_date 2026-01-16 for the rest.",
            );
            expect(r.text).not.toContain("get_meals_by_date for");
        }
    });

    test("a day that half fits is filled meal by meal", () => {
        const day = realisticMonth().slice(0, 6);
        const whole = renderMealListing({
            meals: day,
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: false,
            maxChars: Infinity,
        }).text;
        const r = renderMealListing({
            meals: day,
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: false,
            maxChars: Math.floor(whole.length * 0.75),
        });
        expect(r.truncated).toBe(true);
        expect(r.shownMeals).toBeGreaterThan(1);
        expect(r.shownMeals).toBeLessThan(6);
        expect(r.text.length).toBeLessThanOrEqual(
            Math.floor(whole.length * 0.75),
        );
    });

    test("an exact-fit budget is not truncated", () => {
        const meals = twoADay();
        const base = {
            meals,
            tz: KYIV,
            alcohol: null,
            detail: "full" as const,
            grouped: true,
        };
        const all = renderMealListing({ ...base, maxChars: Infinity });
        const exact = renderMealListing({
            ...base,
            maxChars: all.text.length,
        });
        expect(exact.truncated).toBe(false);
        expect(exact.text).toBe(all.text);
        expect(exact.shownMeals).toBe(20);
        expect(
            renderMealListing({ ...base, maxChars: all.text.length - 1 })
                .truncated,
        ).toBe(true);
    });

    test("an empty listing is just the header", () => {
        const r = renderMealListing({
            meals: [],
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: true,
            maxChars: 1,
        });
        expect(r.truncated).toBe(false);
        expect(r.shownMeals).toBe(0);
    });
});

describe("ingredients in listings", () => {
    const { items } = validateItems(
        [
            {
                name: "Стріпси",
                amount: 170,
                unit: "g",
                calories: 425,
                protein_g: 34,
                carbs_g: 22,
                fat_g: 22,
            },
            {
                name: "Соус",
                amount: 40,
                unit: "g",
                calories: 80,
                protein_g: 0,
                carbs_g: 20,
                fat_g: 0,
            },
        ],
        { addedSugarRequired: false },
    );

    test("full mode appends the items block after the field lines", () => {
        const text = formatMealFull(meal(), null, KYIV, items);
        const lines = text.split("\n");
        const at = lines.indexOf("Items:");
        expect(at).toBeGreaterThan(0);
        // The block follows the field lines directly, with no blank line between.
        expect(lines[at - 1]).not.toBe("");
        expect(lines[at + 1]!.startsWith("  1. Стріпси")).toBe(true);
        expect(lines[at + 2]!.startsWith("  2. Соус")).toBe(true);
    });

    test("full mode with no items is unchanged", () => {
        expect(formatMealFull(meal(), null, KYIV, [])).toBe(
            formatMealFull(meal(), null, KYIV),
        );
        expect(formatMealFull(meal(), null, KYIV)).not.toContain("Items:");
    });

    test("full mode shows items on the alcohol-hidden path without alcohol figures", () => {
        const withAlcohol = validateItems(
            [
                {
                    name: "Пиво",
                    calories: 150,
                    protein_g: 1,
                    carbs_g: 12,
                    fat_g: 0,
                    alcohol_g: 14,
                },
            ],
            { addedSugarRequired: false },
        ).items;
        expect(formatMealFull(meal(), null, KYIV, withAlcohol)).not.toContain(
            "alcohol",
        );
        expect(formatMealFull(meal(), "us", KYIV, withAlcohol)).toContain(
            "alcohol 14 g",
        );
    });

    test("compact line carries the item count before the id", () => {
        const line = formatMealCompact(meal(), null, KYIV, 2);
        expect(line).toContain(" · 2 items [id: ");
        expect(line.indexOf("2 items")).toBeLessThan(line.indexOf("[id:"));
        expect(formatMealCompact(meal(), null, KYIV, 1)).toContain(
            " · 1 item [id: ",
        );
    });

    test("compact line without items is unchanged", () => {
        expect(formatMealCompact(meal(), null, KYIV, 0)).toBe(
            formatMealCompact(meal(), null, KYIV),
        );
        expect(formatMealCompact(meal(), null, KYIV)).not.toContain("item");
    });

    test("renderMealListing passes items through by meal id, in both modes", () => {
        const a = meal({ id: "00000000-0000-4000-8000-0000000000a1" });
        const b = meal({
            id: "00000000-0000-4000-8000-0000000000b2",
            logged_at: "2026-01-15T12:00:00.000Z",
        });
        const map = new Map([[a.id, items]]);
        const compact = renderMealListing({
            meals: [a, b],
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: false,
            items: map,
        });
        const cLines = compact.text
            .split("\n")
            .filter((l) => l.startsWith("- "));
        expect(cLines[1]).toContain("2 items");
        expect(cLines[0]).not.toContain("items");
        const full = renderMealListing({
            meals: [a, b],
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: false,
            items: map,
        });
        expect(full.text.match(/Items:/g)).toHaveLength(1);
        expect(full.text).toContain("  1. Стріпси");
    });
});

describe("sources line in the full listing", () => {
    const SOURCED = meal({
        nutrient_sources: {
            calories: { s: "usda", ref: "171477" },
            protein_g: { s: "estimate" },
        },
        source_detail: { "usda:171477": { name: "Chicken", amount_g: 150 } },
    } as Partial<Meal>);

    test("full mode names the record and what the figures match", () => {
        const { text } = renderMealListing({
            meals: [SOURCED],
            tz: KYIV,
            alcohol: null,
            detail: "full",
            grouped: false,
        });
        expect(text).toContain(
            "Sources: calories match USDA FoodData Central 171477 for 150 g; protein estimated.",
        );
    });

    test("compact mode never carries the line", () => {
        const { text } = renderMealListing({
            meals: [SOURCED],
            tz: KYIV,
            alcohol: null,
            detail: "compact",
            grouped: false,
        });
        expect(text).not.toContain("Sources:");
    });

    test("an unlabelled or all-estimate meal adds no line", () => {
        const estimates = meal({
            nutrient_sources: { calories: { s: "estimate" } },
        } as Partial<Meal>);
        for (const m of [meal(), estimates]) {
            const { text } = renderMealListing({
                meals: [m],
                tz: KYIV,
                alcohol: null,
                detail: "full",
                grouped: false,
            });
            expect(text).not.toContain("Sources:");
        }
    });
});
