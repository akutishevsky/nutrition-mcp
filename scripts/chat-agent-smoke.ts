#!/usr/bin/env bun

/**
 * S8 chat-agent DB smoke (CI database lane).
 *
 * Exercises the real persistence + gate + draft path against a real
 * Postgres: migration 0036 tables with forced RLS, the rail-neutral
 * entitlement gate (Stripe user, Google Play user, Free user,
 * fail-closed lookup), a full Premium send round-trip whose proposal
 * is grounded by a fixture search (provider values for one item, a
 * blocking question and NO values for the other), and the invariant
 * that a chat proposal creates a meal DRAFT — never a confirmed meal.
 * The model call itself is stubbed through the service's dependency
 * seam; the recorded-fixture lane covers the real transport.
 */

import { createSmokeUser } from "./support/smoke-user.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for chat-agent smoke tests");
}

const { upsertSubscription } = await import("../src/billing/repository.js");
const { upsertStoreSubscription } =
    await import("../src/billing/store-repository.js");
const { resolveChatEntitlement } = await import("../src/chat/entitlement.js");
const {
    sendChatMessage,
    getChatState,
    startChatConversation,
    createChatDraftFromProposal,
} = await import("../src/chat/service.js");
const { getLatestChatConversation, listChatMessages, getChatConversation } =
    await import("../src/chat/repository.js");
const { getMealDraft, prepareMealDraftConfirmation } =
    await import("../src/meal-drafts/index.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const freeUser = await createSmokeUser("chat-free");
const stripeUser = await createSmokeUser("chat-stripe");
const playUser = await createSmokeUser("chat-play");
const stranger = await createSmokeUser("chat-stranger");

const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000);
await upsertSubscription({
    userId: stripeUser,
    stripeSubscriptionId: `sub_chat_smoke_${stripeUser}`,
    stripePriceId: "price_chat_smoke",
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
});
await upsertStoreSubscription({
    userId: playUser,
    provider: "google_play",
    appId: "business.munch.app",
    productId: "munch_premium_monthly",
    purchaseToken: `token_chat_smoke_${playUser}`,
    status: "active",
    currentPeriodEnd: periodEnd,
    acknowledged: true,
    verifiedAt: new Date(),
});

// --- Gate behaviour per rail -------------------------------------------
const freeGate = await resolveChatEntitlement(freeUser);
assert(
    !freeGate.allowed && !freeGate.unavailable,
    "Free user must be refused, not unavailable",
);
const stripeGate = await resolveChatEntitlement(stripeUser);
assert(
    stripeGate.allowed && stripeGate.provider === "stripe",
    "Stripe Premium must pass the chat gate",
);
const playGate = await resolveChatEntitlement(playUser);
assert(
    playGate.allowed && playGate.provider === "google_play",
    "Google Play Premium must pass the chat gate",
);

// --- Free send: refused before anything persists ------------------------
const freeSend = await sendChatMessage({
    userId: freeUser,
    message: "Log my lunch",
});
assert(
    freeSend.status === "premium_required",
    "Free send must be premium_required",
);
assert(
    (await getLatestChatConversation(freeUser)) === null,
    "Free send must not persist a conversation",
);
const freeState = await getChatState(freeUser);
assert(
    !freeState.premium && freeState.status === 403,
    "Free chat state must be the 403 gate",
);

// --- Fail-closed send ----------------------------------------------------
const failedGate = await sendChatMessage(
    { userId: stripeUser, message: "Hello" },
    {
        loadSnapshot: async () => {
            throw new Error("snapshot store down");
        },
        hasOverride: async () => false,
    },
);
assert(
    failedGate.status === "entitlement_unavailable",
    "Entitlement lookup failure must fail closed",
);

// --- Premium round-trip with a grounded draft proposal -------------------
const fixtureConfig = {
    apiKey: "smoke-fixture",
    model: "meta/muse-ember",
    baseUrl: "https://openrouter.invalid/v1",
    timeoutMs: 1_000,
    maxTokens: 2_500,
};
const fixtureContext = {
    date: "2026-11-10",
    timezone: "UTC",
    sections: ["today"],
    goals: null,
    today: {
        totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        meals: [],
    },
    pantry: null,
    recent: null,
};
const usdaCandidate = {
    provider: "usda",
    providerFoodId: "171688",
    name: "Chicken breast, grilled",
    dataKind: "generic",
    nutrientsPer100g: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    portions: [
        {
            id: "100g",
            amount: 100,
            unit: "g",
            label: "100 g",
            gramWeight: 100,
            nutrients: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
        },
    ],
    attribution: {
        label: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/food/171688",
    },
    confidence: 0.95,
};
const fixtureSearch = async (query: string) =>
    query.includes("chicken")
        ? { candidates: [usdaCandidate], failures: [] }
        : { candidates: [], failures: [] };

const sent = await sendChatMessage(
    {
        userId: stripeUser,
        message: "Log 150 g grilled chicken and a moon soup",
    },
    {
        config: fixtureConfig,
        assembleContext: async () => fixtureContext as never,
        requestReply: async () => ({
            status: "ok",
            model: "meta/muse-ember",
            response: {
                reply: "Set up as a draft — review and confirm it before anything is logged.",
                proposed_log: {
                    description: "Chicken and soup",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "grilled chicken breast",
                            quantity: 150,
                            unit: "g",
                            assumptions: ["Skinless"],
                        },
                        {
                            name: "mystery moon soup",
                            quantity: 1,
                            unit: "bowl",
                            assumptions: [],
                        },
                    ],
                },
            },
        }),
        createDraft: (input) =>
            createChatDraftFromProposal({
                userId: input.userId,
                proposal: input.proposal,
                search: fixtureSearch as never,
            }),
    },
);
assert(sent.status === "ok", "Premium send must succeed");
assert(sent.draft, "A proposal must produce a draft");
assert(
    sent.draft.sourceMode === "chat",
    "Chat drafts must carry the chat source mode",
);
assert(
    sent.draft.status !== "confirmed" && sent.draft.confirmedMealId === null,
    "A chat proposal must never create a confirmed meal",
);
const groundedItem = sent.draft.items.find((entry) =>
    entry.item.name.includes("Chicken"),
);
assert(groundedItem, "Grounded draft item missing");
assert(
    groundedItem.item.providerFoodId === "171688" &&
        groundedItem.item.nutrients.calories === 247.5,
    "Grounded item nutrition must trace to the USDA record",
);
const ungroundedItem = sent.draft.items.find((entry) =>
    entry.item.name.includes("moon soup"),
);
assert(ungroundedItem, "Ungrounded draft item missing");
assert(
    Object.keys(ungroundedItem.item.nutrients).length === 0,
    "Ungrounded item must carry NO invented nutrition",
);
assert(
    sent.assistantMessage.groundingTrace.length === 2 &&
        sent.assistantMessage.groundingTrace[0]?.grounded === true &&
        sent.assistantMessage.groundingTrace[1]?.grounded === false,
    "Assistant message must carry the per-item grounding trace",
);
assert(
    sent.assistantMessage.draftId === sent.draft.id,
    "Assistant message must link the draft it created",
);

// The blocking question makes the shared confirm path refuse.
let confirmRefused = false;
try {
    await prepareMealDraftConfirmation({
        userId: stripeUser,
        draftId: sent.draft.id,
        expectedVersion: sent.draft.version,
        acceptRemainingAssumptions: true,
    });
} catch {
    confirmRefused = true;
}
assert(
    confirmRefused,
    "Draft with an ungrounded item must refuse confirmation until resolved",
);

// --- Persistence + RLS ----------------------------------------------------
const messages = await listChatMessages({
    userId: stripeUser,
    conversationId: sent.conversation.id,
});
assert(messages.length === 2, "The turn must persist user + assistant");
assert(
    messages[0]?.role === "user" && messages[1]?.role === "assistant",
    "Turn order wrong",
);
assert(
    (await getChatConversation(stranger, sent.conversation.id)) === null,
    "RLS: another user must not read the conversation",
);
assert(
    (
        await listChatMessages({
            userId: stranger,
            conversationId: sent.conversation.id,
        })
    ).length === 0,
    "RLS: another user must not read the messages",
);
const reloadedDraft = await getMealDraft(stripeUser, sent.draft.id);
assert(reloadedDraft?.id === sent.draft.id, "Draft must reload for its owner");

// --- New conversation ------------------------------------------------------
const started = await startChatConversation(playUser);
assert(started.premium, "Play Premium must be able to start a conversation");
const playState = await getChatState(playUser);
assert(playState.premium, "Play Premium chat state must be premium");

await closePlatformDatabase();
console.log(
    "chat-agent smoke: gate per rail (free/stripe/play/fail-closed), grounded draft proposal, blocking confirm refusal, persistence, and RLS all passed",
);
