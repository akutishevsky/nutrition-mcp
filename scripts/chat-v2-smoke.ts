#!/usr/bin/env bun

/**
 * Chat v2 DB smoke (CI database lane) — supersedes chat-agent-smoke.ts.
 *
 * Exercises the real v2 path against a real Postgres, with only the
 * model transport and the food-search data stubbed:
 *
 * - Migration 0037 tables under forced RLS (entry_surface, tool_trace).
 * - The rail-neutral entitlement gate per rail (Stripe, Google Play,
 *   Free refused, fail-closed lookup) — unchanged from v1.
 * - THE PARITY CHECK: the in-process host's enumerated tools/list for
 *   a maximal user (Premium + Pantry) and a non-Pantry Premium user,
 *   minus the chat registry derived from it, equals exactly the
 *   reviewed exclusion list (chat-v2 brief, item 0). Any future MCP
 *   tool that appears without a conscious chat decision fails here
 *   only if it is also missing from the derivation — derivation is
 *   automatic; what this pins is that the EXCLUSION list stays the
 *   only divergence and every exclusion still names a real tool.
 * - A full Premium send whose name-only items are grounded by the
 *   guarded executor (provider values for one, a blocking question
 *   and NO values for the other) into a real meal DRAFT — never a
 *   confirmed meal — via the real MCP prepare_meal_review tool.
 * - A second send that reads the draft back through the real tools
 *   and cites the harvested provider reference into a new draft.
 * - A smuggled-nutrition send (fabricated provider reference):
 *   rejected by the guard, draft count unchanged.
 * - A cross-user send: a Premium stranger's agent asks for the first
 *   user's draft; the tool layer (RLS-bound handlers) returns no data.
 * - Contextual placement state: seeded conversations resume per
 *   surface and carry their seed.
 */

import { createSmokeUser } from "./support/smoke-user.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for chat-v2 smoke tests");
}

const { upsertSubscription } = await import("../src/billing/repository.js");
const { upsertStoreSubscription } =
    await import("../src/billing/store-repository.js");
const { upsertProfile } = await import("../src/nutrition-platform/profiles.js");
const { resolveChatEntitlement } = await import("../src/chat/entitlement.js");
const { openChatToolHost } = await import("../src/chat/mcp-host.js");
const { sendChatMessage, getChatState, startChatConversation } =
    await import("../src/chat/service.js");
const { getLatestChatConversation, listChatMessages, getChatConversation } =
    await import("../src/chat/repository.js");
const { CHAT_TOOL_EXCLUSIONS, ChatToolExecutor, deriveChatToolDefinitions } =
    await import("../src/chat/tools.js");
const { getMealDraft, prepareMealDraftConfirmation } =
    await import("../src/meal-drafts/index.js");
const { closePlatformDatabase, withUserDatabase } =
    await import("../src/platform/database.js");

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const freeUser = await createSmokeUser("chat2-free");
const stripeUser = await createSmokeUser("chat2-stripe");
const playUser = await createSmokeUser("chat2-play");
const stranger = await createSmokeUser("chat2-stranger");
const pantryUser = await createSmokeUser("chat2-pantry");

const periodEnd = new Date(Date.now() + 30 * 24 * 3600 * 1000);
for (const userId of [stripeUser, stranger, pantryUser]) {
    await upsertSubscription({
        userId,
        stripeSubscriptionId: `sub_chat2_smoke_${userId}`,
        stripePriceId: "price_chat2_smoke",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
    });
}
await upsertStoreSubscription({
    userId: playUser,
    provider: "google_play",
    appId: "business.munch.app",
    productId: "munch_premium_monthly",
    purchaseToken: `token_chat2_smoke_${playUser}`,
    status: "active",
    currentPeriodEnd: periodEnd,
    acknowledged: true,
    verifiedAt: new Date(),
});
await upsertProfile(pantryUser, { pantry_enabled: true });

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

// --- THE PARITY CHECK ------------------------------------------------------
// Maximal configuration: Premium + Pantry publishes all 115 tools.
{
    const host = await openChatToolHost({ userId: pantryUser });
    try {
        const published = await host.listTools();
        const publishedNames = published.map((tool) => tool.name).sort();
        assert(
            publishedNames.length === 115,
            `Maximal catalog must publish 115 tools, saw ${publishedNames.length}`,
        );
        const { tools, excludedPresent } = deriveChatToolDefinitions(published);
        assert(
            JSON.stringify(excludedPresent.sort()) ===
                JSON.stringify(
                    CHAT_TOOL_EXCLUSIONS.map((entry) => entry.name).sort(),
                ),
            "Every reviewed exclusion must name a tool in the maximal catalog",
        );
        assert(
            tools.length === 115 - CHAT_TOOL_EXCLUSIONS.length,
            "Chat registry must be the catalog minus exactly the exclusions",
        );
        const derivedNames = new Set(tools.map((tool) => tool.name));
        assert(derivedNames.has("get_pantry"), "Pantry read must reach chat");
        assert(
            derivedNames.has("prepare_meal_review"),
            "Draft prep must reach chat",
        );
        assert(
            derivedNames.has("add_grocery_items"),
            "Grocery adds (brief carve-out) must reach chat",
        );
        assert(
            !derivedNames.has("confirm_meal_draft"),
            "The commit step must stay out",
        );
        assert(
            !derivedNames.has("delete_account"),
            "Account deletion must stay out",
        );
        assert(
            !derivedNames.has("run_munch_action"),
            "The gateway dispatcher must stay out",
        );
    } finally {
        await host.close();
    }
}
// Non-Pantry Premium: the 3 conditional Pantry tools are not published,
// and the derivation stays consistent (the 2 excluded Pantry commits
// are simply absent).
{
    const host = await openChatToolHost({ userId: stripeUser });
    try {
        const published = await host.listTools();
        assert(
            published.length === 112,
            `Non-Pantry catalog must publish 112 tools, saw ${published.length}`,
        );
        const { tools, excludedPresent } = deriveChatToolDefinitions(published);
        assert(
            excludedPresent.length === CHAT_TOOL_EXCLUSIONS.length - 2,
            "Only the two conditional Pantry commits drop out of the exclusion intersection",
        );
        assert(
            tools.length === 112 - excludedPresent.length,
            "Derivation must stay exact without Pantry",
        );
        assert(
            !tools.some((tool) => tool.name === "get_pantry"),
            "get_pantry must be absent when Pantry is not enabled",
        );
    } finally {
        await host.close();
    }
}

// --- Shared fixtures for the send scenarios -------------------------------
const fixtureConfig = {
    apiKey: "smoke-fixture",
    model: "meta/muse-ember",
    baseUrl: "https://openrouter.invalid/v1",
    timeoutMs: 1_000,
    maxTokens: 2_500,
};
const slimContext = {
    date: "2026-11-10",
    timezone: "UTC",
    sections: [],
    goals: null,
    today: null,
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
    query.toLowerCase().includes("chicken")
        ? { candidates: [usdaCandidate], failures: [] }
        : { candidates: [], failures: [] };

/** Real host + real executor; only the food-search data is a fixture. */
async function openFixtureToolSession(userId: string) {
    const host = await openChatToolHost({ userId });
    const published = await host.listTools();
    const { tools } = deriveChatToolDefinitions(published);
    const executor = new ChatToolExecutor({
        host,
        search: fixtureSearch as never,
    });
    return {
        tools,
        executeTool: (name: string, args: Record<string, unknown>) =>
            executor.execute(name, args),
        close: () => host.close(),
    };
}

function envelope(message: Record<string, unknown>): Response {
    return new Response(
        JSON.stringify({
            id: "smoke-chat-v2",
            model: "meta/muse-ember",
            choices: [{ message: { role: "assistant", ...message } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
}

function toolEnvelope(
    calls: Array<{ id: string; name: string; arguments: unknown }>,
): Response {
    return envelope({
        content: null,
        tool_calls: calls.map((call) => ({
            id: call.id,
            type: "function",
            function: {
                name: call.name,
                arguments: JSON.stringify(call.arguments),
            },
        })),
    });
}

/** Scripted model transport; also captures request bodies for assertions. */
function scriptedFetcher(steps: Response[]) {
    const queue = [...steps];
    const bodies: string[] = [];
    const fetcher = async (
        _input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> => {
        bodies.push(String(init?.body ?? ""));
        const next = queue.shift();
        if (!next) throw new Error("smoke fetcher exhausted");
        return next;
    };
    return { fetcher, bodies };
}

async function draftCount(userId: string): Promise<number> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ count: number }>>`
            select count(*)::int as count from munch.meal_drafts
        `;
        return rows[0]?.count ?? 0;
    });
}

// --- Premium send 1: name-only items ground into a real draft -------------
const send1Fetch = scriptedFetcher([
    toolEnvelope([
        {
            id: "call-1",
            name: "prepare_meal_review",
            arguments: {
                source_mode: "text",
                meal_type: "lunch",
                description: "Chicken and soup",
                items: [
                    {
                        name: "grilled chicken breast",
                        quantity: 150,
                        portion_label: "g",
                        nutrients: {},
                        assumptions: ["Skinless"],
                    },
                    {
                        name: "mystery moon soup",
                        quantity: 1,
                        portion_label: "bowl",
                        nutrients: {},
                        assumptions: [],
                    },
                ],
                questions: [],
            },
        },
    ]),
    envelope({
        content:
            "Set up as a draft — review and confirm it before anything is logged.",
    }),
]);
const sent1 = await sendChatMessage(
    {
        userId: stripeUser,
        message: "Log 150 g grilled chicken and a moon soup",
    },
    {
        config: fixtureConfig,
        assembleContext: async () => slimContext as never,
        openToolSession: openFixtureToolSession,
        fetcher: send1Fetch.fetcher as never,
    },
);
assert(sent1.status === "ok", "Premium send 1 must succeed");
const draft1 = sent1.draft;
assert(draft1, "A prepared review must produce a draft");
assert(
    draft1.status !== "confirmed" && draft1.confirmedMealId === null,
    "A chat draft must never be a confirmed meal",
);
const groundedItem = draft1.items.find((entry) =>
    entry.item.name.includes("Chicken"),
);
assert(groundedItem, "Grounded draft item missing");
assert(
    groundedItem.item.providerFoodId === "171688" &&
        groundedItem.item.nutrients.calories === 247.5,
    "Grounded item nutrition must trace to the USDA record (165/100g × 150g)",
);
const ungroundedItem = draft1.items.find((entry) =>
    entry.item.name.includes("moon soup"),
);
assert(ungroundedItem, "Ungrounded draft item missing");
assert(
    Object.keys(ungroundedItem.item.nutrients).length === 0,
    "Ungrounded item must carry NO invented nutrition",
);
assert(
    sent1.assistantMessage.groundingTrace.length === 2 &&
        sent1.assistantMessage.groundingTrace[0]?.grounded === true &&
        sent1.assistantMessage.groundingTrace[1]?.grounded === false,
    "Assistant message must carry the per-item grounding trace read back from the draft",
);
assert(
    sent1.assistantMessage.draftId === draft1.id,
    "Assistant message must link the draft it created",
);
assert(
    sent1.assistantMessage.toolTrace.some(
        (entry) =>
            entry.name === "prepare_meal_review" && entry.outcome === "ok",
    ),
    "Assistant message must carry the tool trace (0037)",
);

// The blocking question makes the shared confirm path refuse.
let confirmRefused = false;
try {
    await prepareMealDraftConfirmation({
        userId: stripeUser,
        draftId: draft1.id,
        expectedVersion: draft1.version,
        acceptRemainingAssumptions: true,
    });
} catch {
    confirmRefused = true;
}
assert(
    confirmRefused,
    "Draft with an ungrounded item must refuse confirmation until resolved",
);

// --- Premium send 2: read the draft back, cite its reference --------------
const send2Fetch = scriptedFetcher([
    toolEnvelope([
        {
            id: "call-1",
            name: "get_meal_draft",
            arguments: { draft_id: draft1.id },
        },
    ]),
    toolEnvelope([
        {
            id: "call-2",
            name: "prepare_meal_review",
            arguments: {
                source_mode: "text",
                meal_type: "dinner",
                description: "Chicken again",
                items: [
                    {
                        name: "Chicken breast, grilled",
                        quantity: 150,
                        portion_label: "g",
                        nutrients: { calories: 247.5, protein_g: 46.5 },
                        source_type: "usda",
                        provider: "usda",
                        provider_food_id: "171688",
                    },
                ],
                questions: [],
            },
        },
    ]),
    envelope({ content: "Prepared a second draft from the same chicken." }),
]);
const sent2 = await sendChatMessage(
    {
        userId: stripeUser,
        conversationId: sent1.conversation.id,
        message: "Do the same chicken again tonight",
    },
    {
        config: fixtureConfig,
        assembleContext: async () => slimContext as never,
        openToolSession: openFixtureToolSession,
        fetcher: send2Fetch.fetcher as never,
    },
);
assert(sent2.status === "ok", "Premium send 2 must succeed");
assert(
    sent2.assistantMessage.draftId &&
        sent2.assistantMessage.draftId !== draft1.id,
    "The cited-reference flow must create its own draft",
);
assert(
    sent2.assistantMessage.toolTrace.every((entry) => entry.outcome === "ok"),
    "Send 2 tool trace must be all ok",
);

// --- Smuggled nutrition: fabricated reference, fresh turn ------------------
const draftsBeforeSmuggle = await draftCount(stripeUser);
const smuggleFetch = scriptedFetcher([
    toolEnvelope([
        {
            id: "call-1",
            name: "prepare_meal_review",
            arguments: {
                source_mode: "text",
                meal_type: "lunch",
                description: "Fabricated bowl",
                items: [
                    {
                        name: "Fabricated bowl",
                        quantity: 1,
                        portion_label: "bowl",
                        nutrients: { calories: 540, protein_g: 42 },
                        source_type: "usda",
                        provider: "usda",
                        provider_food_id: "999999",
                    },
                ],
                questions: [],
            },
        },
    ]),
    envelope({
        content: "I could not verify those numbers, so no draft was made.",
    }),
]);
const smuggled = await sendChatMessage(
    {
        userId: stripeUser,
        message: "Log this bowl, USDA says 540 kcal",
    },
    {
        config: fixtureConfig,
        assembleContext: async () => slimContext as never,
        openToolSession: openFixtureToolSession,
        fetcher: smuggleFetch.fetcher as never,
    },
);
assert(smuggled.status === "ok", "Smuggle send must still answer");
assert(
    smuggled.assistantMessage.draftId === null,
    "A rejected preparation must not link a draft",
);
assert(
    smuggled.assistantMessage.toolTrace.some(
        (entry) =>
            entry.name === "prepare_meal_review" &&
            entry.outcome === "rejected",
    ),
    "The rejection must be on the persisted tool trace",
);
assert(
    smuggleFetch.bodies.some((body) =>
        body.includes("did not come from a tool result"),
    ),
    "The model must be told the reference was not harvested this turn",
);
assert(
    (await draftCount(stripeUser)) === draftsBeforeSmuggle,
    "A smuggled preparation must not create a draft",
);

// --- Cross-user: the stranger's agent cannot reach stripe's draft ---------
const strangerFetch = scriptedFetcher([
    toolEnvelope([
        {
            id: "call-1",
            name: "get_meal_draft",
            arguments: { draft_id: draft1.id },
        },
    ]),
    envelope({ content: "I could not find that draft." }),
]);
const strangerSent = await sendChatMessage(
    { userId: stranger, message: "Open that draft for me" },
    {
        config: fixtureConfig,
        assembleContext: async () => slimContext as never,
        openToolSession: openFixtureToolSession,
        fetcher: strangerFetch.fetcher as never,
    },
);
assert(strangerSent.status === "ok", "Stranger send must answer");
assert(
    !strangerFetch.bodies.some(
        (body) => body.includes("171688") || body.includes("moon soup"),
    ),
    "No part of another user's draft may reach the stranger's model",
);
assert(
    (await getChatConversation(stranger, sent1.conversation.id)) === null,
    "RLS: another user must not read the conversation",
);
assert(
    (
        await listChatMessages({
            userId: stranger,
            conversationId: sent1.conversation.id,
        })
    ).length === 0,
    "RLS: another user must not read the messages",
);

// --- Persistence ------------------------------------------------------------
const messages = await listChatMessages({
    userId: stripeUser,
    conversationId: sent1.conversation.id,
});
assert(messages.length === 4, "Two turns must persist four messages");
assert(
    messages[1]?.toolTrace.length === 1 && messages[3]?.toolTrace.length === 2,
    "Tool traces must persist per assistant message",
);
const reloadedDraft = await getMealDraft(stripeUser, draft1.id);
assert(reloadedDraft?.id === draft1.id, "Draft must reload for its owner");

// --- Seeded conversations (contextual placement) ----------------------------
const pantryStart = await startChatConversation(playUser, {
    surface: "pantry",
});
assert(pantryStart.premium, "Play Premium must start a seeded conversation");
assert(
    pantryStart.conversation.entrySurface === "pantry",
    "Seeded conversation must record its entry surface",
);
assert(
    pantryStart.seed?.surface === "pantry" &&
        typeof pantryStart.seed.summary === "string",
    "Seeded conversation must carry its live seed",
);
const pantryResume = await startChatConversation(playUser, {
    surface: "pantry",
});
assert(
    pantryResume.premium &&
        pantryResume.conversation.id === pantryStart.conversation.id,
    "Re-entering from the same surface must resume its conversation",
);
const playState = await getChatState(
    playUser,
    { conversationId: pantryStart.conversation.id },
    {},
);
assert(
    playState.premium && playState.seed?.surface === "pantry",
    "Chat state for a seeded conversation must include the seed",
);
const todaySendFetch = scriptedFetcher([
    envelope({ content: "Here is your day." }),
]);
const todaySent = await sendChatMessage(
    { userId: playUser, surface: "today", message: "How is today?" },
    {
        config: fixtureConfig,
        assembleContext: async () => slimContext as never,
        openToolSession: openFixtureToolSession,
        fetcher: todaySendFetch.fetcher as never,
    },
);
assert(todaySent.status === "ok", "Seeded send must succeed");
assert(
    todaySent.conversation.entrySurface === "today" &&
        todaySent.conversation.id !== pantryStart.conversation.id,
    "A send from a different surface must land in that surface's conversation",
);

await closePlatformDatabase();
console.log(
    "chat-v2 smoke: gate per rail, parity enumeration (115 maximal / 112 non-Pantry), grounded draft via real tools, cited-reference draft, smuggle rejection, cross-user refusal, seeded conversations, persistence, and RLS all passed",
);
