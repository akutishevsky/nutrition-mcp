#!/usr/bin/env bun

import { createSmokeUser } from "./support/smoke-user.js";

const {
    addMealDraftQuestion,
    answerMealDraftQuestion,
    cancelMealDraft,
    confirmMealDraft,
    createMealDraft,
    deleteMealDraftItem,
    getMealDraft,
    prepareMealDraftConfirmation,
    updateMealDraftMetadata,
    upsertMealDraftItem,
} = await import("../src/meal-drafts/repository.js");
const { getStructuredMeal } =
    await import("../src/structured-meals/repository.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for meal-draft smoke tests");
}

const userA = await createSmokeUser("draft-a");
const userB = await createSmokeUser("draft-b");
let draft = await createMealDraft({
    userId: userA,
    sourceMode: "photo",
    description: "Chicken and rice plate",
    mealType: "lunch",
    loggedAt: "2026-08-03T18:00:00.000Z",
});
if (draft.status !== "open" || draft.version !== 1) {
    throw new Error("New draft did not start in the expected state");
}

const staleVersion = draft.version;
draft = await upsertMealDraftItem({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    position: 0,
    item: {
        name: "Chicken and rice",
        portionLabel: "1 plate",
        nutrients: {
            calories: 620,
            protein_g: 42,
            carbs_g: 70,
            fat_g: 18,
        },
        sourceType: "model_estimate",
        confidence: 0.7,
        assumptions: ["Initial plate-size estimate"],
        sourceSnapshot: { source: "photo", model: "host vision" },
    },
});
if (draft.status !== "awaiting_confirmation" || draft.version !== 2) {
    throw new Error("Adding a draft item did not update state/version");
}

let staleRejected = false;
try {
    await updateMealDraftMetadata({
        userId: userA,
        draftId: draft.id,
        expectedVersion: staleVersion,
        notes: "stale write",
    });
} catch (error) {
    staleRejected = String(error).includes("expected version");
}
if (!staleRejected) throw new Error("Stale draft update was not rejected");

const itemId = draft.items[0]!.id;
draft = await addMealDraftQuestion({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    itemId,
    questionKey: "portion_eaten",
    prompt: "How much of the plate did you eat?",
    impactScore: 95,
});
draft = await addMealDraftQuestion({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    itemId,
    questionKey: "hidden_oil",
    prompt: "Was oil or butter added?",
    impactScore: 80,
});
if (
    draft.status !== "awaiting_answers" ||
    draft.questions.find((question) => question.status === "open")
        ?.questionKey !== "portion_eaten"
) {
    throw new Error("Draft questions were not ordered by impact");
}

let prematureRejected = false;
try {
    await prepareMealDraftConfirmation({
        userId: userA,
        draftId: draft.id,
        expectedVersion: draft.version,
    });
} catch (error) {
    prematureRejected = String(error).includes("unresolved question");
}
if (!prematureRejected) {
    throw new Error("Draft prepared despite unresolved questions");
}

const portionQuestion = draft.questions.find(
    (question) => question.questionKey === "portion_eaten",
)!;
const currentItem = draft.items[0]!.item;
draft = await upsertMealDraftItem({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    position: 0,
    item: {
        ...currentItem,
        assumptions: [
            ...(currentItem.assumptions ?? []).filter(
                (assumption) => assumption !== "Initial plate-size estimate",
            ),
            "User confirmed the entire estimated plate was consumed.",
        ],
        sourceSnapshot: {
            ...(currentItem.sourceSnapshot ?? {}),
            established_facts: {
                consumed_fraction: 1,
                consumed_amount: "entire plate",
            },
        },
    },
});
draft = await answerMealDraftQuestion({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    questionId: portionQuestion.id,
    answer: "I ate the entire plate.",
});
if (
    draft.questions.find((question) => question.status === "open")
        ?.questionKey !== "hidden_oil"
) {
    throw new Error("Next draft question was not advanced correctly");
}

draft = await prepareMealDraftConfirmation({
    userId: userA,
    draftId: draft.id,
    expectedVersion: draft.version,
    acceptRemainingAssumptions: true,
});
if (
    draft.status !== "awaiting_confirmation" ||
    draft.questions.some((question) => question.status === "open")
) {
    throw new Error("Draft assumptions were not accepted for confirmation");
}

const confirmVersion = draft.version;
draft = await confirmMealDraft({
    userId: userA,
    draftId: draft.id,
    expectedVersion: confirmVersion,
    confirmed: true,
});
if (draft.status !== "confirmed" || !draft.confirmedMealId) {
    throw new Error("Prepared draft was not confirmed");
}
const meal = await getStructuredMeal(userA, draft.confirmedMealId);
if (!meal || meal.items.length !== 1 || meal.calories !== 620) {
    throw new Error("Confirmed draft did not create the structured meal");
}
if (
    !meal.items[0]?.assumptions.some((value) =>
        value.includes("User accepted unresolved assumption"),
    )
) {
    throw new Error(
        "Accepted unresolved assumption was not preserved on the meal",
    );
}
if (
    !meal.items[0]?.assumptions.some((value) =>
        value.includes("entire estimated plate was consumed"),
    )
) {
    throw new Error("Reconciled portion answer was not preserved on the meal");
}

const retry = await confirmMealDraft({
    userId: userA,
    draftId: draft.id,
    expectedVersion: confirmVersion,
    confirmed: true,
});
if (retry.confirmedMealId !== draft.confirmedMealId) {
    throw new Error("Confirmation retry created or returned a different meal");
}
if (await getMealDraft(userB, draft.id)) {
    throw new Error("Cross-tenant draft read was allowed");
}
if (await getStructuredMeal(userB, draft.confirmedMealId)) {
    throw new Error("Cross-tenant confirmed meal read was allowed");
}

let cancelled = await createMealDraft({
    userId: userA,
    sourceMode: "text",
    description: "Cancelled snack",
    mealType: "snack",
});
cancelled = await cancelMealDraft({
    userId: userA,
    draftId: cancelled.id,
    expectedVersion: cancelled.version,
});
if (cancelled.status !== "cancelled" || cancelled.confirmedMealId) {
    throw new Error("Draft cancellation created an unexpected meal");
}

let removable = await createMealDraft({
    userId: userA,
    sourceMode: "text",
    description: "Draft with removable items",
    mealType: "dinner",
});
for (const [position, name] of (
    ["First item", "Second item"] as const
).entries()) {
    removable = await upsertMealDraftItem({
        userId: userA,
        draftId: removable.id,
        expectedVersion: removable.version,
        position,
        item: {
            name,
            nutrients: { calories: 100 + position },
            sourceType: "user_supplied",
        },
    });
}
removable = await deleteMealDraftItem({
    userId: userA,
    draftId: removable.id,
    itemId: removable.items[0]!.id,
    expectedVersion: removable.version,
});
if (
    removable.items.length !== 1 ||
    removable.items[0]?.position !== 0 ||
    removable.items[0]?.item.name !== "Second item"
) {
    throw new Error("Draft item deletion did not compact positions safely");
}

// S3 hardening: a BLOCKING question (photo item with no nutrition
// values) cannot be accepted away — prepare must refuse even with
// acceptRemainingAssumptions, naming the item; supplying the item's
// nutrition and answering the question unblocks confirmation.
let blocked = await createMealDraft({
    userId: userA,
    sourceMode: "photo",
    description: "Plate with an unestimated item",
    mealType: "lunch",
});
blocked = await upsertMealDraftItem({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
    position: 0,
    item: {
        name: "cooked white rice",
        quantity: 1,
        portionLabel: "1 cup",
        nutrients: {},
        sourceType: "model_estimate",
        confidence: 0.8,
        assumptions: [],
        sourceSnapshot: {
            resolution_layer: "meal_photo_grounding",
            estimate_status: "unavailable",
        },
    },
});
const blockedItemId = blocked.items[0]!.id;
blocked = await addMealDraftQuestion({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
    itemId: blockedItemId,
    questionKey: "photo_estimate_missing_0",
    prompt: "We couldn't find nutrition for cooked white rice (1 cup). Please supply or confirm its nutrition, or remove the item.",
    impactScore: 100,
});
let blockingRefusal = "";
try {
    await prepareMealDraftConfirmation({
        userId: userA,
        draftId: blocked.id,
        expectedVersion: blocked.version,
        acceptRemainingAssumptions: true,
    });
} catch (error) {
    blockingRefusal = String(error);
}
if (
    !blockingRefusal.includes("cannot be confirmed") ||
    !blockingRefusal.includes("cooked white rice")
) {
    throw new Error(
        `Blocking question was accepted away or the refusal did not name the item: ${blockingRefusal}`,
    );
}
if (
    blocked.questions.find(
        (question) => question.questionKey === "photo_estimate_missing_0",
    )?.status !== "open"
) {
    throw new Error("Blocking question did not remain open after refusal");
}
// Supply the nutrition (item update reconciles the question), answer
// it, then preparation and confirmation succeed.
blocked = await upsertMealDraftItem({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
    position: 0,
    item: {
        ...blocked.items[0]!.item,
        nutrients: { calories: 205, protein_g: 4.3, carbs_g: 44.5, fat_g: 0.4 },
        sourceType: "user_supplied",
    },
});
const blockingQuestion = blocked.questions.find(
    (question) => question.questionKey === "photo_estimate_missing_0",
)!;
blocked = await answerMealDraftQuestion({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
    questionId: blockingQuestion.id,
    answer: "Confirmed the rice nutrition from the package label.",
});
blocked = await prepareMealDraftConfirmation({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
});
blocked = await confirmMealDraft({
    userId: userA,
    draftId: blocked.id,
    expectedVersion: blocked.version,
    confirmed: true,
});
if (blocked.status !== "confirmed" || !blocked.confirmedMealId) {
    throw new Error("Resolved blocking draft was not confirmed");
}
const blockedMeal = await getStructuredMeal(userA, blocked.confirmedMealId);
if (!blockedMeal || blockedMeal.calories !== 205) {
    throw new Error("Resolved blocking draft logged the wrong totals");
}

// Amendment E item 3: conversational add-to-draft on a photo draft,
// exercised end-to-end against the real draft machinery with stub
// grounding deps (recorded data only — no live model calls).
const { addTextToPhotoDraft } = await import("../src/meal-photo/draft-add.js");
const butterCandidate = {
    provider: "usda",
    providerFoodId: "173430",
    name: "Butter, salted",
    dataKind: "generic",
    nutrientsPer100g: {
        calories: 717,
        protein_g: 0.85,
        carbs_g: 0.06,
        fat_g: 81.1,
    },
    portions: [
        {
            id: "tbsp",
            amount: 1,
            unit: "tbsp",
            label: "1 tbsp",
            gramWeight: 14.2,
            nutrients: {
                calories: 102,
                protein_g: 0.12,
                carbs_g: 0.01,
                fat_g: 11.5,
            },
        },
    ],
    attribution: {
        label: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/food/173430",
    },
    confidence: 0.95,
};
const broccoliCandidate = {
    ...butterCandidate,
    providerFoodId: "170379",
    name: "Broccoli, cooked",
    nutrientsPer100g: {
        calories: 35,
        protein_g: 2.4,
        carbs_g: 7.2,
        fat_g: 0.4,
    },
    portions: [
        {
            id: "serving",
            amount: 1,
            unit: "serving",
            label: "1 serving",
            gramWeight: 100,
            nutrients: {
                calories: 35,
                protein_g: 2.4,
                carbs_g: 7.2,
                fat_g: 0.4,
            },
        },
    ],
    attribution: {
        label: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/food/170379",
    },
};
const addSearch = async (query: string) => {
    if (query.includes("butter")) {
        return { candidates: [butterCandidate], failures: [] };
    }
    if (query.includes("broccoli")) {
        return { candidates: [broccoliCandidate], failures: [] };
    }
    return { candidates: [], failures: [] };
};

let photoAdd = await createMealDraft({
    userId: userA,
    sourceMode: "photo",
    description: "Photo estimate — check portions",
    mealType: "dinner",
});
photoAdd = await upsertMealDraftItem({
    userId: userA,
    draftId: photoAdd.id,
    expectedVersion: photoAdd.version,
    position: 0,
    item: {
        name: "grilled chicken breast",
        quantity: 160,
        portionLabel: "160 g",
        nutrients: { calories: 264, protein_g: 49.6, carbs_g: 0, fat_g: 5.8 },
        sourceType: "usda",
        confidence: 0.85,
        assumptions: ["assumed skinless breast"],
        sourceSnapshot: { resolution_layer: "meal_photo_grounding" },
    },
});
const addedOutcome = await addTextToPhotoDraft({
    userId: userA,
    draft: photoAdd,
    text: "I added a good bit of butter",
    deps: { search: addSearch as never },
});
if (addedOutcome.status !== "added") {
    throw new Error(`Butter add did not land: ${addedOutcome.status}`);
}
photoAdd = addedOutcome.draft;
const butterItem = photoAdd.items.find((record) =>
    record.item.name.includes("Butter"),
);
if (
    photoAdd.items.length !== 2 ||
    !butterItem ||
    butterItem.item.nutrients.calories !== 102 ||
    !butterItem.item.assumptions.some((value) =>
        value.startsWith('Added by you: "I added a good bit of butter"'),
    ) ||
    !butterItem.item.assumptions.some((value) => value.includes("a good bit"))
) {
    throw new Error(
        "Butter add was not persisted with provenance + assumption",
    );
}
const photoTotal = photoAdd.items.reduce(
    (sum, record) => sum + (record.item.nutrients.calories ?? 0),
    0,
);
if (photoTotal !== 366) {
    throw new Error(`Photo draft totals did not recompute: ${photoTotal}`);
}

// Weak ungrounded add → draft question, items unchanged.
const questionOutcome = await addTextToPhotoDraft({
    userId: userA,
    draft: photoAdd,
    text: "added qwixle",
    deps: { search: addSearch as never },
});
if (questionOutcome.status !== "question") {
    throw new Error("Weak ungrounded add did not become a question");
}
photoAdd = questionOutcome.draft;
if (
    photoAdd.items.length !== 2 ||
    !photoAdd.questions.some(
        (question) =>
            question.status === "open" &&
            question.questionKey.startsWith("photo_draft_add_unresolved_"),
    )
) {
    throw new Error("Unresolved add question was not persisted on the draft");
}

// Unparseable add → honest no-add, draft completely unchanged.
const versionBeforeNoAdd = photoAdd.version;
const noAddOutcome = await addTextToPhotoDraft({
    userId: userA,
    draft: photoAdd,
    text: "the weather is nice today",
    deps: {
        search: addSearch as never,
        parseWithModel: async () => ({ items: [], replaces: null }),
    },
});
if (
    noAddOutcome.status !== "no_add" ||
    noAddOutcome.draft.version !== versionBeforeNoAdd ||
    noAddOutcome.draft.items.length !== 2
) {
    throw new Error("Unparseable add changed the draft");
}

// Replacement rides remove+add: chicken out, broccoli in.
const replaceOutcome = await addTextToPhotoDraft({
    userId: userA,
    draft: photoAdd,
    text: "actually steamed broccoli, not grilled chicken breast",
    deps: { search: addSearch as never },
});
if (
    replaceOutcome.status !== "added" ||
    replaceOutcome.replacedItemName !== "grilled chicken breast"
) {
    throw new Error("Replacement add did not report the removed item");
}
photoAdd = replaceOutcome.draft;
if (
    photoAdd.items.some((record) =>
        record.item.name.includes("chicken breast"),
    ) ||
    !photoAdd.items.some((record) => record.item.name.includes("Broccoli"))
) {
    throw new Error("Replacement did not swap the draft items");
}

// Confirm-before-save is unchanged: the open add question must be
// accepted through the existing path before confirmation succeeds,
// and the logged meal carries butter + broccoli only (102 + 35).
photoAdd = await prepareMealDraftConfirmation({
    userId: userA,
    draftId: photoAdd.id,
    expectedVersion: photoAdd.version,
    acceptRemainingAssumptions: true,
});
photoAdd = await confirmMealDraft({
    userId: userA,
    draftId: photoAdd.id,
    expectedVersion: photoAdd.version,
    confirmed: true,
});
const photoMeal = await getStructuredMeal(userA, photoAdd.confirmedMealId!);
if (!photoMeal || photoMeal.calories !== 137 || photoMeal.items.length !== 2) {
    throw new Error(
        `Confirmed photo-add draft logged wrong totals: ${photoMeal?.calories}`,
    );
}

await closePlatformDatabase();
console.log(
    "Munch meal draft state, confirmation, idempotency, and RLS smoke test passed.",
);
