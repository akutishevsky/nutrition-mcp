import type { MealDraft, MealDraftQuestion } from "./types.js";

/**
 * Blocking draft questions (S3 hardening).
 *
 * A question is BLOCKING when its key carries this prefix. Blocking
 * questions are created by the photo pipeline when an item ends up with
 * NO nutrition values at all (no provider candidate and the labelled
 * model-estimate step failed or returned unusable output). Unlike an
 * ordinary low-confidence question, a blocking question can NOT be
 * waved through with `accept_remaining_assumptions`: the user must
 * supply/confirm the item's nutrition (which updates the item, then the
 * question can be answered) or remove the item (which cascades the
 * question away with it). The guard lives here as pure functions over
 * the draft shape so the shared confirm path — `prepareMealDraftConfirmation`
 * and `confirmMealDraft` in repository.ts, used by BOTH the web route
 * (POST /api/app/meal-drafts/:id/confirm) and the MCP confirm tools —
 * enforces it identically, and so it is unit-testable without a database.
 *
 * Scope: the guard triggers only on open questions with this key
 * prefix. Drafts that carry no questions, or only ordinary questions,
 * are completely unaffected.
 */
export const BLOCKING_DRAFT_QUESTION_KEY_PREFIX = "photo_estimate_missing_";

export function blockingQuestionKey(index: number): string {
    return `${BLOCKING_DRAFT_QUESTION_KEY_PREFIX}${index}`;
}

export function isBlockingDraftQuestion(
    question: Pick<MealDraftQuestion, "questionKey">,
): boolean {
    return question.questionKey.startsWith(BLOCKING_DRAFT_QUESTION_KEY_PREFIX);
}

export function openBlockingQuestions(
    draft: Pick<MealDraft, "questions">,
): MealDraftQuestion[] {
    return draft.questions.filter(
        (question) =>
            question.status === "open" && isBlockingDraftQuestion(question),
    );
}

/** Display names of the items an open blocking question refers to. */
export function blockingQuestionItemNames(
    draft: Pick<MealDraft, "questions" | "items">,
): string[] {
    const names: string[] = [];
    for (const question of openBlockingQuestions(draft)) {
        const item = question.itemId
            ? draft.items.find((record) => record.id === question.itemId)
            : undefined;
        names.push(item?.item.name ?? question.questionKey);
    }
    return names;
}

export function blockingConfirmationError(draft: MealDraft): Error {
    const names = blockingQuestionItemNames(draft);
    return new Error(
        `Meal draft cannot be confirmed: ${names.join(", ")} ${names.length === 1 ? "has" : "have"} no nutrition values and an unresolved blocking question. Supply or confirm the nutrition for ${names.length === 1 ? "that item" : "those items"}, or remove ${names.length === 1 ? "it" : "them"}, before confirming.`,
    );
}

/** Throws naming the blocked item(s) when any blocking question is open. */
export function assertNoOpenBlockingQuestions(draft: MealDraft): void {
    if (openBlockingQuestions(draft).length > 0) {
        throw blockingConfirmationError(draft);
    }
}
