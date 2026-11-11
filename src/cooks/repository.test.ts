import { describe, expect, test } from "bun:test";
import {
    parseNaturalCookUpdate,
    serializeCookRow,
    buildCookRecipeDraft,
    buildRecipeCookDish,
    sanitizeRecipeProgress,
} from "./repository.js";

describe("natural cook updates", () => {
    test("records multiple events and preserves approximate relative time", () => {
        const submittedAt = "2026-09-14T18:00:00.000Z";
        const parsed = parseNaturalCookUpdate(
            "I heated the grill to 250°F a couple minutes ago and put the wings on.",
            submittedAt,
            "America/New_York",
        );

        expect(parsed.isQuestion).toBe(false);
        expect(parsed.events.map((event) => event.eventType)).toEqual([
            "preheat",
            "food_on",
        ]);
        expect(parsed.events[0]?.timePrecision).toBe("approximate");
        expect(parsed.events[0]?.relativePhrase).toBe("a couple minutes ago");
        expect(parsed.events[0]?.setpointTemperature).toBe(250);
        expect(parsed.events[0]?.setpointUnit).toBe("F");
        expect(parsed.suggestions.dish).toBe("wings");
        expect(parsed.suggestions.equipment).toBe("grill");
    });

    test("does not turn advisory questions into factual events", () => {
        const parsed = parseNaturalCookUpdate(
            "Should I wrap these wings now?",
            "2026-09-14T18:00:00.000Z",
        );

        expect(parsed.isQuestion).toBe(true);
        expect(parsed.events).toHaveLength(0);
        expect(parsed.summary).toContain("no cooking event");
    });

    test("keeps factual events before a trailing advisory question", () => {
        const parsed = parseNaturalCookUpdate(
            "I heated the smoker to 250°F. Should I wrap these wings now?",
            "2026-09-14T18:00:00.000Z",
        );

        expect(parsed.isQuestion).toBe(true);
        expect(parsed.events.map((event) => event.eventType)).toEqual([
            "preheat",
        ]);
        expect(parsed.events[0]?.originalMessage).toContain("Should I wrap");
    });

    test("supports temperature channels and free-form observations", () => {
        const parsed = parseNaturalCookUpdate(
            "The smoker environment is 275°F; internal chicken temp is 155°F. I wrapped and sauced the wings.",
            "2026-09-14T18:00:00.000Z",
        );

        expect(parsed.events.map((event) => event.eventType)).toEqual([
            "temperature_change",
            "temperature_change",
            "wrap",
            "sauce",
        ]);
        expect(parsed.events[0]?.ambientTemperature).toBe(275);
        expect(parsed.events[0]?.internalTemperature).toBeUndefined();
        expect(parsed.events[1]?.internalTemperature).toBe(155);
        expect(parsed.events[1]?.ambientTemperature).toBeUndefined();
    });
});

describe("production certification regressions", () => {
    const submitted = "2026-09-16T11:06:23.000Z";
    test("serializes SQL Date and date text as calendar dates", () => {
        for (const date of [
            new Date("2026-09-16T00:00:00.000Z"),
            "2026-09-16",
        ]) {
            const row = serializeCookRow(
                {
                    id: "test",
                    cook_date: date,
                    created_at: submitted,
                    updated_at: submitted,
                },
                "user",
            );
            expect(row.cook_date).toBe("2026-09-16");
            expect(new Date(`${row.cook_date}T12:00:00Z`).toISOString()).toBe(
                "2026-09-16T12:00:00.000Z",
            );
        }
    });
    test("keeps each clause's time, precision, temperature and original message", () => {
        const message =
            "I preheated the smoker to 225°F about ten minutes ago, put the food on five minutes ago, and just wrapped it.";
        const { events } = parseNaturalCookUpdate(
            message,
            submitted,
            "America/New_York",
        );
        expect(events.map((e) => e.eventType)).toEqual([
            "preheat",
            "food_on",
            "wrap",
        ]);
        expect(events.map((e) => e.eventAt)).toEqual([
            "2026-09-16T10:56:23.000Z",
            "2026-09-16T11:01:23.000Z",
            submitted,
        ]);
        expect(events.map((e) => e.relativePhrase)).toEqual([
            "about ten minutes ago",
            "five minutes ago",
            "just",
        ]);
        expect(
            events.every(
                (e) =>
                    e.timePrecision === "approximate" &&
                    e.eventTimezone === "America/New_York" &&
                    e.originalMessage === message,
            ),
        ).toBe(true);
        expect(events[0]?.setpointTemperature).toBe(225);
        expect(events[2]?.setpointTemperature).toBeUndefined();
    });
    test("records a factual wrap temperature but not an advisory temperature", () => {
        const question = parseNaturalCookUpdate(
            "Would it be better to wrap at 165°F?",
            submitted,
        );
        expect(question.events).toHaveLength(0);
        const { events } = parseNaturalCookUpdate(
            "Record that I wrapped at 165°F.",
            submitted,
        );
        expect(events).toHaveLength(1);
        expect(events[0]?.eventType).toBe("wrap");
        expect(events[0]?.internalTemperature).toBe(165);
        expect(events[0]?.internalUnit).toBe("F");
        expect(events[0]?.ambientTemperature).toBeUndefined();
    });
    test("does not leak a trailing question's temperature into facts", () => {
        const { events } = parseNaturalCookUpdate(
            "I wrapped it. Would it be better to wrap at 165°F?",
            submitted,
        );
        expect(events).toHaveLength(1);
        expect(events[0]?.internalTemperature).toBeUndefined();
    });
    test("handles numeric hours and decimal temperatures without sharing times", () => {
        const { events } = parseNaturalCookUpdate(
            "I heated the smoker to 225.5°F 2 hours ago and put the food on 5 minutes ago.",
            submitted,
        );
        expect(events[0]?.setpointTemperature).toBe(225.5);
        expect(events[0]?.eventAt).toBe("2026-09-16T09:06:23.000Z");
        expect(events[1]?.eventAt).toBe("2026-09-16T11:01:23.000Z");
    });
    test("draft leaves servings unknown, flags quantities and deduplicates legacy timeline text", () => {
        const detail = {
            cook: { id: "cook", notes: null },
            dishes: [
                {
                    id: "dish",
                    name: "wings",
                    actual_ingredients: ["chicken wings"],
                },
            ],
            events: [
                { dish_id: null, note: "Wrap the wings." },
                { dish_id: null, note: "Wrap the wings." },
                { dish_id: "other", note: "Other dish." },
            ],
        } as unknown as Parameters<typeof buildCookRecipeDraft>[0];
        const before = JSON.stringify(detail);
        const result = buildCookRecipeDraft(detail);
        expect(result.draft.servings).toBeNull();
        expect(result.missing_fields).toContain("servings");
        expect(result.missing_fields).toContain("ingredients[0].quantity/unit");
        expect(result.draft.instructions).toEqual(["Wrap the wings."]);
        expect(JSON.stringify(detail)).toBe(before);
    });
});

describe("recipe cook mode progress (R2)", () => {
    test("buildRecipeCookDish pins the revision, steps, and a fresh checklist", () => {
        const dish = buildRecipeCookDish({
            name: "Smoke Pie",
            recipeId: "recipe-1",
            revisionId: "revision-1",
            instructions: ["Mix the filling.", "Bake 40 minutes."],
            ingredients: [
                { name: "butter", quantity: 0.5, unit: "cup" },
                { name: "salt" },
                {
                    name: "egg wash",
                    quantity: 1,
                    unit: "egg",
                    preparation: "beaten",
                    optional: true,
                },
            ],
        });
        expect(dish.recipeId).toBe("recipe-1");
        expect(dish.recipeRevisionId).toBe("revision-1");
        expect(dish.recipeProgress).toEqual({
            steps: ["Mix the filling.", "Bake 40 minutes."],
            checkedIngredients: [],
            checkedSteps: [],
        });
        expect(dish.actualIngredients).toEqual([
            { name: "butter", quantity: 0.5, unit: "cup" },
            { name: "salt" },
            {
                name: "egg wash",
                quantity: 1,
                unit: "egg",
                preparation: "beaten",
                optional: true,
            },
        ]);
    });

    test("sanitizeRecipeProgress bounds, dedupes, and sorts checked positions", () => {
        const progress = sanitizeRecipeProgress(
            {
                steps: ["a", "b"],
                checked_ingredients: [2, 0, 0, -1, 1.5, "x"],
                checkedSteps: [1, 1, 7],
            },
            3,
        );
        expect(progress).toEqual({
            steps: ["a", "b"],
            checkedIngredients: [0, 2],
            checkedSteps: [1],
        });
    });

    test("sanitizeRecipeProgress rejects non-objects and tolerates camelCase", () => {
        expect(sanitizeRecipeProgress(null, 2)).toBeNull();
        expect(sanitizeRecipeProgress("nope", 2)).toBeNull();
        expect(sanitizeRecipeProgress([1, 2], 2)).toBeNull();
        expect(
            sanitizeRecipeProgress(
                {
                    steps: ["only step"],
                    checkedIngredients: [1],
                    checked_steps: [0],
                },
                2,
            ),
        ).toEqual({
            steps: ["only step"],
            checkedIngredients: [1],
            checkedSteps: [0],
        });
    });
});
