#!/usr/bin/env bun

import {
    dismissGoalPrompt,
    getGoalPromptDismissed,
    readNextUpCache,
    readNextUpCacheForDate,
    writeNextUpCache,
} from "../src/app/next-up-repository.js";
import { logNextUpSuggestion } from "../src/app/next-up.js";
import { getMealDraft } from "../src/meal-drafts/index.js";
import {
    addGroceryItems,
    getGroceryList,
    getMealPlan,
    saveRecipe,
} from "../src/planning/repository.js";
import { closePlatformDatabase } from "../src/platform/database.js";
import { createSmokeIdentity } from "./support/smoke-user.js";

// Next up (guidance rework D3/D4/D6): the composition cache persists
// per user + date + day-part and is invisible across accounts under
// RLS; the one-time goal-prompt dismissal sticks; and Log it opens a
// pre-filled draft through confirm-before-save — no meal is logged
// until the draft is confirmed, which this smoke deliberately never
// does.

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the next-up smoke");
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

const owner = await createSmokeIdentity("nextup-owner");
const other = await createSmokeIdentity("nextup-other");
const DATE = "2026-11-10";
const composition = {
    candidate_id: "recipe:placeholder",
    servings: 1,
    reason: "It uses the chicken breast — the pantry item that's been sitting longest.",
    source: "deterministic" as const,
};

try {
    // Cache round-trip under the owner's RLS context.
    assert(
        (await readNextUpCache(owner.userId, DATE, "midday")) === null,
        "fresh account should have no cached composition",
    );
    await writeNextUpCache(owner.userId, DATE, "midday", "fp-1", composition);
    const cached = await readNextUpCache(owner.userId, DATE, "midday");
    assert(cached?.fingerprint === "fp-1", "cache fingerprint did not persist");
    assert(
        cached?.composition.candidate_id === composition.candidate_id,
        "cache composition did not persist",
    );
    const forDate = await readNextUpCacheForDate(owner.userId, DATE);
    assert(
        forDate?.candidate_id === composition.candidate_id,
        "chat-seed cache read did not find the composition",
    );
    // A new fingerprint replaces the row (one row per day-part).
    await writeNextUpCache(owner.userId, DATE, "midday", "fp-2", composition);
    assert(
        (await readNextUpCache(owner.userId, DATE, "midday"))?.fingerprint ===
            "fp-2",
        "cache upsert did not replace the fingerprint",
    );
    // RLS: the other account sees nothing of the owner's cache.
    assert(
        (await readNextUpCache(other.userId, DATE, "midday")) === null,
        "another account read the owner's cached composition",
    );

    // D6 dismissal: defaults false, sticks after dismiss, per-account.
    assert(
        (await getGoalPromptDismissed(owner.userId)) === false,
        "goal prompt should start un-dismissed",
    );
    await dismissGoalPrompt(owner.userId);
    assert(
        (await getGoalPromptDismissed(owner.userId)) === true,
        "goal prompt dismissal did not persist",
    );
    assert(
        (await getGoalPromptDismissed(other.userId)) === false,
        "dismissal leaked across accounts",
    );

    // D3 Log it: a saved recipe becomes a pre-filled draft; nothing
    // is logged by the call itself.
    const saved = await saveRecipe({
        userId: owner.userId,
        scope: { type: "personal" },
        recipe: {
            name: "Next Up Smoke Chicken Bowl",
            servings: 1,
            sourceType: "user_entered",
            instructions: ["Cook the chicken.", "Serve over rice."],
            ingredients: [
                {
                    name: "Chicken breast",
                    quantity: 1,
                    unit: "piece",
                    nutrients: {
                        calories: 220,
                        protein_g: 40,
                        carbs_g: 0,
                        fat_g: 5,
                    },
                    sourceType: "user_supplied",
                },
                {
                    name: "Rice",
                    quantity: 1,
                    unit: "cup",
                    nutrients: {
                        calories: 200,
                        protein_g: 4,
                        carbs_g: 44,
                        fat_g: 1,
                    },
                    sourceType: "user_supplied",
                },
            ],
        },
        idempotencyKey: "nextup-smoke-recipe",
    });
    const { draft_id } = await logNextUpSuggestion(owner.userId, {
        date: DATE,
        candidate_id: `recipe:${saved.recipeId}`,
        slot: "dinner",
        servings: 1,
    });
    const draft = await getMealDraft(owner.userId, draft_id);
    assert(draft !== null, "Log it did not create a draft");
    assert(
        draft!.items.length === 2,
        `draft should carry both recipe foods, got ${draft!.items.length}`,
    );
    assert(
        draft!.status !== "confirmed" && draft!.confirmedMealId === null,
        "Log it must never confirm the meal itself",
    );
    assert(
        draft!.mealType === "dinner",
        "draft should target the suggested slot",
    );

    // D3 Plan it happens through scheduleRecipe in the service; here
    // the plan read proves the same repository round-trips (the full
    // action is covered end-to-end by the website e2e).
    const plan = await getMealPlan({
        userId: owner.userId,
        startDate: DATE,
        endDate: DATE,
        scope: "all",
    });
    assert(Array.isArray(plan), "plan read failed");

    // D3 Add-missing merge: adding the same name+unit twice merges
    // quantities instead of duplicating the row (R3 rules).
    await addGroceryItems({
        userId: owner.userId,
        scope: { type: "personal" },
        items: [{ name: "Broccoli", quantity: 1, unit: "head" }],
    });
    const merged = await addGroceryItems({
        userId: owner.userId,
        scope: { type: "personal" },
        items: [{ name: "Broccoli", quantity: 2, unit: "head" }],
    });
    assert(
        (merged.items[0] as { merged?: boolean }).merged === true,
        "second add of the same grocery should merge",
    );
    const list = await getGroceryList({
        userId: owner.userId,
        scope: { type: "personal" },
    });
    const broccoli = list.items.filter((item) => item.name === "Broccoli");
    assert(broccoli.length === 1, "merged grocery duplicated the row");
    assert(
        broccoli[0]?.quantity === 3,
        `merged quantity should be 3, got ${broccoli[0]?.quantity}`,
    );

    console.log("next-up smoke passed");
} finally {
    await closePlatformDatabase();
}
