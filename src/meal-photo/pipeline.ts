import {
    addMealDraftQuestion,
    createMealDraft,
    upsertMealDraftItem,
    type MealDraft,
} from "../meal-drafts/index.js";
import {
    groundMealPhotoItems,
    type GroundedMealPhotoItem,
    type MealPhotoGroundingDeps,
} from "./grounding.js";
import type { MealPhotoVisionResult } from "./vision.js";

/**
 * Stage 5 of the photo-logging pipeline (brief §3): land the grounded
 * estimate in the EXISTING meal-draft machinery — draft → questions →
 * `accept_remaining_assumptions` → confirm — unchanged. Nothing is
 * logged until the user confirms through the existing confirm path.
 * Low-confidence items become draft QUESTIONS, not silent guesses.
 */

export const PHOTO_DRAFT_DESCRIPTION = "Photo estimate — check portions";
export const PHOTO_DRAFT_NOTES =
    "Photo estimate — check portions. The meal photo was processed transiently to build this estimate and was not retained.";

export interface MealPhotoDraftResult {
    draft: MealDraft;
    grounded: GroundedMealPhotoItem[];
    groundedCount: number;
    questionCount: number;
}

export async function createMealPhotoDraft(input: {
    userId: string;
    vision: MealPhotoVisionResult;
    groundingDeps: MealPhotoGroundingDeps;
    mealType?: MealDraft["mealType"];
    description?: string;
    loggedAt?: string;
}): Promise<MealPhotoDraftResult> {
    const grounded = await groundMealPhotoItems(
        input.vision.items,
        input.groundingDeps,
    );
    let draft = await createMealDraft({
        userId: input.userId,
        sourceMode: "photo",
        mealType: input.mealType,
        description: input.description?.trim() || PHOTO_DRAFT_DESCRIPTION,
        loggedAt: input.loggedAt,
        notes: PHOTO_DRAFT_NOTES,
    });
    for (const [index, entry] of grounded.entries()) {
        draft = await upsertMealDraftItem({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            position: index,
            item: entry.draftItem,
        });
    }
    // Questions reference the persisted item records, so they are added
    // after every item exists, threading the draft version each time.
    for (const [index, entry] of grounded.entries()) {
        if (!entry.question) continue;
        const record = draft.items.find((item) => item.position === index);
        draft = await addMealDraftQuestion({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            questionKey: entry.question.questionKey,
            prompt: entry.question.prompt,
            impactScore: entry.question.impactScore,
            itemId: record?.id,
        });
    }
    return {
        draft,
        grounded,
        groundedCount: grounded.filter((entry) => entry.grounded).length,
        questionCount: grounded.filter((entry) => entry.question).length,
    };
}
