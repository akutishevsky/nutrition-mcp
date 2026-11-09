import { describe, expect, test } from "bun:test";
import {
    assertNoOpenBlockingQuestions,
    blockingQuestionItemNames,
    blockingQuestionKey,
    isBlockingDraftQuestion,
    openBlockingQuestions,
} from "./blocking.js";
import type { MealDraft } from "./types.js";

function draftWith(
    questions: Array<{
        questionKey: string;
        status: "open" | "answered" | "accepted_assumption";
        itemId?: string | null;
    }>,
): MealDraft {
    return {
        id: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        status: "awaiting_answers",
        sourceMode: "photo",
        mealType: "lunch",
        description: "Fixture plate",
        loggedAt: null,
        notes: null,
        version: 3,
        expiresAt: "2999-01-01T00:00:00.000Z",
        confirmedMealId: null,
        createdAt: "2026-11-09T00:00:00.000Z",
        updatedAt: "2026-11-09T00:00:00.000Z",
        items: [
            {
                id: "33333333-3333-4333-8333-333333333333",
                position: 1,
                createdAt: "2026-11-09T00:00:00.000Z",
                updatedAt: "2026-11-09T00:00:00.000Z",
                item: {
                    name: "cooked white rice",
                    quantity: 1,
                    portionLabel: "1 cup",
                    nutrients: {},
                    sourceType: "model_estimate",
                    assumptions: [],
                    sourceSnapshot: {},
                },
            },
        ],
        questions: questions.map((question, index) => ({
            id: `44444444-4444-4444-8444-44444444444${index}`,
            itemId:
                question.itemId === undefined
                    ? "33333333-3333-4333-8333-333333333333"
                    : question.itemId,
            questionKey: question.questionKey,
            prompt: "prompt",
            impactScore: 100,
            status: question.status,
            answer: question.status === "open" ? null : "answer",
            createdAt: "2026-11-09T00:00:00.000Z",
            answeredAt:
                question.status === "open" ? null : "2026-11-09T00:00:00.000Z",
        })),
    };
}

describe("blocking draft questions (shared confirm guard)", () => {
    test("key convention: only the photo_estimate_missing_ prefix blocks", () => {
        expect(blockingQuestionKey(2)).toBe("photo_estimate_missing_2");
        expect(
            isBlockingDraftQuestion({ questionKey: blockingQuestionKey(0) }),
        ).toBe(true);
        expect(
            isBlockingDraftQuestion({ questionKey: "photo_portion_0" }),
        ).toBe(false);
        expect(isBlockingDraftQuestion({ questionKey: "oil_amount" })).toBe(
            false,
        );
    });

    test("an open blocking question makes confirmation throw, naming the item", () => {
        const draft = draftWith([
            { questionKey: blockingQuestionKey(1), status: "open" },
        ]);
        expect(openBlockingQuestions(draft)).toHaveLength(1);
        expect(blockingQuestionItemNames(draft)).toEqual(["cooked white rice"]);
        let message = "";
        try {
            assertNoOpenBlockingQuestions(draft);
        } catch (error) {
            message = String(error);
        }
        expect(message).toContain("cooked white rice");
        expect(message).toContain("cannot be confirmed");
    });

    test("scope: drafts with no questions or only ordinary questions are NOT blocked", () => {
        expect(() =>
            assertNoOpenBlockingQuestions(draftWith([])),
        ).not.toThrow();
        expect(() =>
            assertNoOpenBlockingQuestions(
                draftWith([{ questionKey: "photo_portion_1", status: "open" }]),
            ),
        ).not.toThrow();
    });

    test("scope: answered or accepted blocking questions no longer block", () => {
        expect(() =>
            assertNoOpenBlockingQuestions(
                draftWith([
                    { questionKey: blockingQuestionKey(1), status: "answered" },
                ]),
            ),
        ).not.toThrow();
        expect(() =>
            assertNoOpenBlockingQuestions(
                draftWith([
                    {
                        questionKey: blockingQuestionKey(1),
                        status: "accepted_assumption",
                    },
                ]),
            ),
        ).not.toThrow();
    });
});
