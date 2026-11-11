import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import { CAPABILITY_MANIFEST } from "../src/capability-manifest.ts";

/**
 * S5 (Full Parity App Program) — packaged-app parity verification.
 *
 * Where mobile-bundle.e2e.ts proves the shell boots and behaves offline,
 * this spec exercises the capability manifest's app channel against the
 * PACKAGED `.mobile-web` bundle (the exact artifact that ships inside
 * the Android APK), row family by row family:
 *
 * - a bundle-content sweep asserting every app-complete / app-partial
 *   row's declared entry points are physically present in the bundle;
 * - a route sweep rendering every Operate surface in the bundle;
 * - deep exercises for the rows S5 was dispatched to settle:
 *   meal.photoLog (partial since S3 — full photo → draft → add-text →
 *   confirm flow through the native capture wiring), the three
 *   missing-with-exception rows that were believed to live inside the
 *   packaged SPA (mcp.connection.revoke, household.manage,
 *   account.export), and the two legitimate website-only billing rows
 *   (billing.checkout / billing.portal — the packaged surface must
 *   route honestly, never run Stripe checkout in the app).
 *
 * Like the S4 stub in mobile-bundle.e2e.ts, the native-bridge surface
 * is faked (Keystore session, camera, Play Billing, ads) while the
 * transport, app.js, app-account.js and the native-enhancement modules
 * are the REAL packaged files. Two fidelity extensions over the S4
 * stub, both mirroring the real runtime (mobile/runtime.js): the stub
 * defines `window.MunchAds` (runtime.js:33 — its presence is what makes
 * the billing/household pages render their Android variants), and the
 * stub camera returns a real (1×1 PNG) photo so meal-photo-native.js's
 * DataTransfer handoff into the S3 dialog is exercised for real.
 *
 * Requires `bun run mobile:web` first (CI does this in the website-e2e
 * job before running this config).
 */

const bundleDir = join(process.cwd(), ".mobile-web");

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
};

let server: Server;
let baseURL: string;

/** Every API request the packaged app made, in order. */
const observed: { method: string; path: string; search: string }[] = [];

type SettingsVariant = "android-free" | "android-free-stripe";
type HouseholdVariant = "none" | "owner" | "member";
/** S6 slice 9: sign-in methods fixture states (Amendment I). */
type SignInMethodsVariant = "default" | "linkable" | "refusal";
let signInMethodsVariant: SignInMethodsVariant = "default";
let googleUnlinked = false;
let settingsVariant: SettingsVariant = "android-free";
let householdVariant: HouseholdVariant = "none";
let connectionsFixture: Record<string, unknown>[] = [];
/** S6 slice 1: a pending draft card on Today, removed by a cancel. */
let pendingDraftOnToday = false;
/** S6 slice 1: the ADS-FOUNDATION remote flag as the server sends it. */
let adsFlagOn = false;
/** S6 slice 4: the fixture salmon recipe, removed by an archive. */
let recipeArchived = false;
/** S6 slice 7: vitals entries removed by the inline-confirm flows. */
const vitalsRemovedIds = new Set<string>();
/** S6 slice 6: grocery items removed / purchased-cleared by the flows. */
let groceryCleared = false;
const groceryRemovedIds = new Set<string>();
/** S6 slice 8: household flows exercised against the fixture server. */
let householdMemberRemoved = false;
let householdInviteRevoked = false;
let householdGone = false;
/** S8: chat agent fixture states — Premium thread vs the Free gate. */
let chatVariant: "premium" | "free" = "premium";
let chatSent = false;
/** Chat v2: the entry surface of the currently seeded conversation. */
let chatSeedSurface: string | null = null;

/** Chat v2 seed fixtures — the shape src/chat/seeds.ts returns. */
const CHAT_SEED_FIXTURES: Record<
    string,
    {
        surface: string;
        summary: string;
        opener: string;
        starters: string[];
    }
> = {
    today: {
        surface: "today",
        summary: "Today so far: 0 kcal across 0 meals · goal 2,000 kcal.",
        opener: "Nothing is logged yet today. Tell me what you've eaten and I'll prepare it as a draft for you to confirm — or ask how to shape the rest of the day.",
        starters: [
            "How is today looking against my goals?",
            "What should dinner be to land the day well?",
            "Log what I just ate",
        ],
    },
    meal_plan: {
        surface: "meal_plan",
        summary: "0 of 7 days have something planned · Monday is empty.",
        opener: "This week has a gap on Monday. I can suggest filling it from your recipes or what's in the pantry — or explain or adjust any day's plan.",
        starters: [
            "Fill the gaps in this plan",
            "Explain this week's plan",
            "Build the grocery list from this plan",
        ],
    },
    pantry: {
        surface: "pantry",
        summary: "2 items on hand — including Chicken thighs, Spinach.",
        opener: "You have 2 items on hand — Chicken thighs, Spinach among them. Ask what to cook tonight, what to use up first, or what's missing for a full meal.",
        starters: [
            "What can I cook tonight from this?",
            "What should I use up first?",
            "What am I missing for a full meal?",
        ],
    },
    insights: {
        surface: "insights",
        summary: "Last 7 days: 0 kcal logged across 0 meals.",
        opener: "Here's your last seven days. Ask me to explain the pattern, find where protein dipped, or suggest one change for next week.",
        starters: [
            "Explain my week",
            "Where did my protein dip?",
            "What one change helps most next week?",
        ],
    },
};

function chatConversationFixture(entrySurface: string | null) {
    return {
        id: entrySurface
            ? `fixture-chat-${entrySurface}-conversation`
            : "fixture-chat-conversation",
        title: null,
        entrySurface,
        createdAt: "2026-11-10T12:00:00.000Z",
        updatedAt: "2026-11-10T12:00:00.000Z",
    };
}

const CHAT_USER_MESSAGE = {
    id: "fixture-chat-user-message",
    conversationId: "fixture-chat-conversation",
    role: "user",
    content: "Log 150 g grilled chicken and a moon soup for lunch",
    model: null,
    draftId: null,
    groundingTrace: [],
    toolTrace: [],
    createdAt: "2026-11-10T12:00:00.000Z",
};

const CHAT_ASSISTANT_MESSAGE = {
    id: "fixture-chat-assistant-message",
    conversationId: "fixture-chat-conversation",
    role: "assistant",
    content:
        "Set up as a draft — review it and confirm before anything is logged.",
    model: "meta/muse-ember",
    draftId: "fixture-chat-draft",
    toolTrace: [
        { name: "search_foods", outcome: "ok" },
        { name: "prepare_meal_review", outcome: "ok" },
    ],
    groundingTrace: [
        {
            name: "Grilled chicken breast",
            grounded: true,
            estimated: false,
            groundingSource: "USDA",
            provider: "usda",
            providerFoodId: "171688",
            candidateId: "fixture-candidate-chicken",
        },
        {
            name: "Mystery moon soup",
            grounded: false,
            estimated: false,
            groundingSource: "model_estimate",
            provider: null,
            providerFoodId: null,
            candidateId: null,
        },
    ],
    createdAt: "2026-11-10T12:00:05.000Z",
};

const CHAT_DRAFT = {
    id: "fixture-chat-draft",
    status: "awaiting_answers",
    description: "Chicken and soup",
    version: 2,
    meal_type: "lunch",
    logged_at: "2026-11-10T12:00:00.000Z",
    notes: "Proposed by the Munch chat agent — check items and portions before confirming. Nothing is logged until you confirm this draft.",
    source_mode: "chat",
    expires_at: null,
    totals: { calories: 247.5, protein_g: 46.5, carbs_g: 0, fat_g: 5.4 },
    questions: [
        {
            id: "fixture-chat-question",
            item_id: null,
            question_key: "photo_estimate_missing_1",
            prompt: "We couldn't find nutrition for mystery moon soup (1 bowl) in a food database, and the automatic estimate didn't come through. Please supply or confirm its nutrition, or remove the item — this draft can't be confirmed until that's done.",
            status: "open",
        },
    ],
    items: [
        {
            name: "Chicken breast, grilled",
            source_type: "usda",
            confidence: 0.8,
            portion_label: "150 g",
            quantity: 150,
            gram_weight: 150,
            nutrients: {
                calories: 247.5,
                protein_g: 46.5,
                carbs_g: 0,
                fat_g: 5.4,
            },
            provider: "usda",
            assumptions: ["Skinless"],
        },
    ],
};

const GROCERY_FIXTURE_ITEMS = [
    {
        grocery_item_id: "fixture-grocery-spinach",
        name: "Baby spinach",
        quantity: 1,
        unit: "bag",
        note: null,
        purchased_at: null,
        source_recipe_id: null,
        source_planned_meal_id: "fixture-planned-meal",
        added_by: null,
        version: 1,
    },
    {
        grocery_item_id: "fixture-grocery-rice",
        name: "Jasmine rice",
        quantity: 4,
        unit: "lb",
        note: null,
        purchased_at: null,
        source_recipe_id: "fixture-recipe-1",
        source_planned_meal_id: null,
        added_by: null,
        version: 1,
    },
    {
        grocery_item_id: "fixture-grocery-eggs",
        name: "Eggs",
        quantity: 18,
        unit: "ct",
        note: null,
        purchased_at: "2026-11-09T12:00:00.000Z",
        source_recipe_id: null,
        source_planned_meal_id: null,
        added_by: null,
        version: 2,
    },
    {
        grocery_item_id: "fixture-grocery-milk",
        name: "Oat milk",
        quantity: 2,
        unit: "carton",
        note: null,
        purchased_at: null,
        source_recipe_id: null,
        source_planned_meal_id: null,
        added_by: null,
        version: 1,
    },
];

function groceryFixture() {
    return [
        {
            scope: "personal",
            groceryListId: "fixture-grocery-list",
            items: GROCERY_FIXTURE_ITEMS.filter(
                (item) =>
                    !groceryRemovedIds.has(item.grocery_item_id) &&
                    !(groceryCleared && item.purchased_at),
            ),
        },
    ];
}

/** S6 slice 5: the fixture active cook, finished / deleted in tests. */
let cookFinished = false;
let cookDeleted = false;

/** Trends: the mock server holds the account's dashboard layout;
    the workspace fixture rebuilds its cards from it on every read,
    so edit-mode PUTs re-render exactly like the real server. */
type TrendsLayoutCard = { shape: string; data: string; size: string };
function defaultTrendsLayout(): { version: number; cards: TrendsLayoutCard[] } {
    return {
        version: 1,
        cards: [
            { shape: "bar", data: "calories", size: "full" },
            { shape: "line", data: "weight", size: "full" },
            { shape: "bar", data: "protein_g", size: "full" },
            { shape: "consistency", data: "logging", size: "compact" },
            { shape: "bar", data: "water_ml", size: "compact" },
        ],
    };
}
let trendsLayoutFixture = defaultTrendsLayout();
/** The vitals regression runs its delete flows on Today now that the
    Insights destination retired; its entries ride the Today fixture
    only when a test asks for them. */
let vitalsOnToday = false;

const TRENDS_FIXTURE_DATES = [
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
    "2026-11-09",
];

function trendsBarDaysFixture(values: (number | null)[]) {
    return TRENDS_FIXTURE_DATES.map((date, i) => ({
        date,
        value: values[i] ?? null,
        hasLog: values[i] != null,
    }));
}

const TRENDS_CARD_FIXTURES: Record<string, Record<string, unknown>> = {
    "bar:calories": {
        shape: "bar",
        data: "calories",
        title: "Calories",
        subtitle: "Daily total · kcal",
        headline: { value: "1,940", unit: "kcal", note: "daily average" },
        verdict: {
            lead: "Target 2,200 kcal — ",
            strong: "in range 1 of 6 days",
        },
        coverage: null,
        empty: null,
        chart: {
            kind: "bars",
            metric: "calories",
            unit: "kcal",
            days: trendsBarDaysFixture([
                2010,
                1885,
                2140,
                null,
                1995,
                2050,
                1660,
            ]),
            reference: {
                type: "band",
                value: 2090,
                value2: 2310,
                label: "target 2,090–2,310",
            },
            rolling: TRENDS_FIXTURE_DATES.map((date, i) => ({
                date,
                value: [2010, 1947, 2011, 2011, 2007, 2018, 1968][i],
            })),
        },
    },
    "line:weight": {
        shape: "line",
        data: "weight",
        title: "Weight",
        subtitle: "Trend weight · lb",
        headline: { value: "182.6", unit: "lb", note: "trend weight" },
        verdict: {
            lead: "Trend is easing down — ",
            strong: "about −0.4 lb a week",
        },
        coverage: null,
        empty: null,
        chart: {
            kind: "line",
            metric: "weight",
            unit: "lb",
            points: [
                { date: "2026-11-03", value: 184.1 },
                { date: "2026-11-05", value: 183.6 },
                { date: "2026-11-07", value: 183 },
                { date: "2026-11-09", value: 182.4 },
            ],
            trend: [
                { date: "2026-11-03", value: 184.1 },
                { date: "2026-11-05", value: 183.9 },
                { date: "2026-11-07", value: 183.6 },
                { date: "2026-11-09", value: 183.2 },
            ],
            target: 175,
            startLabel: "2026-10-11",
            endLabel: "2026-11-09",
        },
    },
    "bar:protein_g": {
        shape: "bar",
        data: "protein_g",
        title: "Protein",
        subtitle: "Daily total · g",
        headline: { value: "131", unit: "g", note: "daily average" },
        verdict: {
            lead: "Target 150 g — ",
            strong: "hit it 1 of 6 days",
        },
        coverage: null,
        empty: null,
        chart: {
            kind: "bars",
            metric: "protein_g",
            unit: "g",
            days: trendsBarDaysFixture([128, 142, 119, null, 135, 151, 110]),
            reference: {
                type: "line",
                value: 150,
                label: "target 150 g",
            },
            rolling: null,
        },
    },
    "consistency:logging": {
        shape: "consistency",
        data: "logging",
        title: "Consistency",
        subtitle: "Logging",
        headline: { value: "6", unit: "", note: "of 7 days logged" },
        verdict: { lead: "", strong: "on a 3-day streak" },
        coverage: null,
        empty: null,
        chart: {
            kind: "consistency",
            metric: "calories",
            full: false,
            cells: TRENDS_FIXTURE_DATES.map((date, i) => ({
                date,
                level: [3, 2, 3, 0, 2, 3, 2][i],
                active: i !== 3,
            })),
        },
    },
    "bar:water_ml": {
        shape: "bar",
        data: "water_ml",
        title: "Water",
        subtitle: "Daily total · ml",
        headline: { value: "1.8", unit: "L", note: "daily average" },
        verdict: {
            lead: "Target 2,500 ml — ",
            strong: "hit it 0 of 6 days",
        },
        coverage: null,
        empty: null,
        chart: {
            kind: "bars",
            metric: "water_ml",
            unit: "ml",
            days: trendsBarDaysFixture([
                1750,
                2100,
                1600,
                null,
                2250,
                1900,
                1250,
            ]),
            reference: {
                type: "line",
                value: 2500,
                label: "target 2,500 ml",
            },
            rolling: null,
        },
    },
    "bar:fiber_g": {
        shape: "bar",
        data: "fiber_g",
        title: "Fiber",
        subtitle: "Daily total · g",
        headline: { value: "24", unit: "g", note: "daily average" },
        verdict: {
            lead: "Target 30 g — ",
            strong: "hit it 0 of 4 days",
        },
        coverage: { carriedDays: 4, totalDays: 7 },
        empty: null,
        chart: {
            kind: "bars",
            metric: "fiber_g",
            unit: "g",
            days: trendsBarDaysFixture([22, null, 28, null, 25, null, 19]),
            reference: {
                type: "line",
                value: 30,
                label: "target 30 g",
            },
            rolling: null,
        },
    },
    "breakdown:macro_split": {
        shape: "breakdown",
        data: "macro_split",
        title: "Macro split",
        subtitle: "Share of calories",
        headline: { value: "1,940", unit: "kcal", note: "daily average" },
        verdict: {
            lead: "Protein is carrying ",
            strong: "26% of calories",
        },
        coverage: null,
        empty: null,
        chart: {
            kind: "donut",
            segments: [
                { key: "protein_g", label: "Protein", grams: 128, share: 26 },
                { key: "carbs_g", label: "Carbs", grams: 205, share: 42 },
                { key: "fat_g", label: "Fat", grams: 68, share: 29 },
                { key: "alcohol_g", label: "Alcohol", grams: 13, share: 3 },
            ],
            columns: [
                {
                    label: "2026-10-26",
                    shares: {
                        protein_g: 25,
                        carbs_g: 43,
                        fat_g: 29,
                        alcohol_g: 3,
                    },
                },
                {
                    label: "2026-11-02",
                    shares: {
                        protein_g: 26,
                        carbs_g: 42,
                        fat_g: 29,
                        alcohol_g: 3,
                    },
                },
            ],
            centerValue: 1940,
        },
    },
};

const TRENDS_CATALOG_FIXTURE = [
    {
        shape: "bar",
        label: "Bar chart",
        blurb: "A column per day, judged against its line",
        data: [
            {
                key: "calories",
                label: "Calories",
                note: "",
                defaultSize: "full",
            },
            {
                key: "protein_g",
                label: "Protein",
                note: "",
                defaultSize: "full",
            },
            {
                key: "fiber_g",
                label: "Fiber",
                note: "Recorded on some days only",
                defaultSize: "full",
            },
            {
                key: "water_ml",
                label: "Water",
                note: "",
                defaultSize: "compact",
            },
        ],
    },
    {
        shape: "line",
        label: "Trend line",
        blurb: "The smoothed story, not the daily noise",
        data: [
            { key: "weight", label: "Weight", note: "", defaultSize: "full" },
            { key: "water_ml", label: "Water", note: "", defaultSize: "full" },
        ],
    },
    {
        shape: "consistency",
        label: "Consistency",
        blurb: "Show up, day after day",
        data: [
            {
                key: "logging",
                label: "Logging",
                note: "",
                defaultSize: "compact",
            },
            {
                key: "weigh_ins",
                label: "Weigh-ins",
                note: "",
                defaultSize: "compact",
            },
        ],
    },
    {
        shape: "breakdown",
        label: "Breakdown",
        blurb: "Where the calories come from",
        data: [
            {
                key: "macro_split",
                label: "Macro split",
                note: "",
                defaultSize: "full",
            },
            {
                key: "meal_type_split",
                label: "Meal-type split",
                note: "",
                defaultSize: "full",
            },
        ],
    },
    {
        shape: "patterns",
        label: "Patterns",
        blurb: "Rhythms across the week",
        data: [
            {
                key: "weekday",
                label: "Weekday pattern",
                note: "",
                defaultSize: "full",
            },
        ],
    },
];

function trendsWorkspaceFixture() {
    return {
        startDate: "2026-10-11",
        endDate: "2026-11-09",
        rangeDays: 30,
        timezone: "UTC",
        weightUnit: "lb",
        alcoholTrackingEnabled: true,
        layout: trendsLayoutFixture,
        catalog: TRENDS_CATALOG_FIXTURE,
        cards: trendsLayoutFixture.cards
            .map((card) => {
                const fixture =
                    TRENDS_CARD_FIXTURES[`${card.shape}:${card.data}`];
                return fixture ? { ...fixture, size: card.size } : null;
            })
            .filter(Boolean),
        digest: {
            weekly: "You logged 6 of the last 7 days, averaging 1,940 kcal on the days you recorded. Your weight trend eased down across the week.",
            trends: "Recorded calories averaged 1,940 kcal across the 6 logged days, against a 2,200 kcal goal. Protein averaged 128 g against a 150 g goal.",
            patterns:
                "Lunch is your most consistently logged meal (7 of 7 days). Snacks appear on 4 of 7 days.",
        },
    };
}

const COOK_FIXTURES = [
    {
        id: "fixture-chicken-rice",
        title: "Weeknight Chicken & Rice",
        cook_date: "2026-11-09",
        status: "active",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 0,
    },
    {
        id: "fixture-salmon-cook",
        title: "Sheet-Pan Salmon & Broccoli",
        cook_date: "2026-11-08",
        status: "finished",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 2,
    },
    {
        id: "fixture-wings",
        title: "Smoked Lemon Pepper Wings",
        cook_date: "2026-11-07",
        status: "finished",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 3,
    },
    {
        id: "fixture-chili",
        title: "Turkey Chili",
        cook_date: "2026-11-04",
        status: "finished",
        source_cook_id: "fixture-earlier-chili",
        notes: "",
        latest_photo_url: null,
        photo_count: 1,
    },
];

function cookDetailFixture() {
    return {
        cook: {
            id: "fixture-chicken-rice",
            title: "Weeknight Chicken & Rice",
            status: cookFinished ? "finished" : "active",
            cook_date: "2026-11-09",
            timezone: "UTC",
            version: 1,
            notes: "",
            original_message:
                "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
            source_cook_id: null,
        },
        dishes: [
            {
                id: "fixture-dish-1",
                name: "Chicken & Rice",
                method: "Stovetop",
                flavor: "Garlic & herb",
                equipment: "Skillet",
                ingredient_or_cut: "Chicken thighs",
                recipe_id: null,
                recipe_revision_id: null,
            },
        ],
        media: [],
        events: [
            {
                id: "fixture-event-1",
                event_type: "food_on",
                event_at: "2026-11-09T17:48:00.000Z",
                submitted_at: "2026-11-09T17:50:00.000Z",
                time_precision: "approximate",
                note: "Chicken went into the hot skillet.",
                original_message:
                    "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
                relative_phrase: "a couple minutes ago",
                setpoint_temperature: null,
                setpoint_unit: null,
                ambient_temperature: null,
                ambient_unit: null,
                internal_temperature: null,
                internal_unit: null,
            },
        ],
        outcomes: [],
        updates: [
            {
                submitted_at: "2026-11-09T17:50:00.000Z",
                source: "web",
                raw_message:
                    "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
                media_status: "saved",
            },
        ],
    };
}

const RECIPE_FIXTURES = [
    {
        recipe_id: "fixture-lemon-chicken",
        revision_id: "fixture-lemon-chicken-r1",
        name: "Lemon Herb Chicken & Rice",
        version: 1,
        ownership: "personal",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 512,
            protein_g: 44,
            carbs_g: 48,
            fat_g: 15,
        },
        times_scheduled: 6,
        times_logged: 9,
    },
    {
        recipe_id: "fixture-overnight-oats",
        revision_id: "fixture-overnight-oats-r1",
        name: "Overnight Oats",
        version: 1,
        ownership: "personal",
        servings: 2,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 385,
            protein_g: 14,
            carbs_g: 52,
            fat_g: 13,
        },
        times_scheduled: 3,
        times_logged: 11,
    },
    {
        recipe_id: "fixture-turkey-chili",
        revision_id: "fixture-turkey-chili-r1",
        name: "Turkey Chili",
        version: 1,
        ownership: "household",
        servings: 6,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 428,
            protein_g: 32,
            carbs_g: 38,
            fat_g: 16,
        },
        times_scheduled: 2,
        times_logged: 4,
    },
    {
        recipe_id: "fixture-salmon",
        revision_id: "fixture-salmon-r3",
        name: "Sheet-Pan Salmon & Broccoli",
        version: 3,
        ownership: "personal",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 412,
            protein_g: 36,
            carbs_g: 9,
            fat_g: 25,
        },
        times_scheduled: 4,
        times_logged: 5,
    },
];

const RECIPE_DETAIL_FIXTURE = {
    recipe: {
        id: "fixture-salmon",
        revision_id: "fixture-salmon-r3",
        revision_number: 3,
        version: 3,
        name: "Sheet-Pan Salmon & Broccoli",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 412,
            protein_g: 36,
            carbs_g: 9,
            fat_g: 25,
        },
        ingredients: [
            {
                name: "Atlantic salmon fillets",
                quantity: 680,
                unit: "g",
                nutrients: { calories: 1416 },
                source_type: "usda",
            },
            {
                name: "Broccoli florets",
                quantity: 600,
                unit: "g",
                nutrients: { calories: 204 },
                source_type: "usda",
            },
            {
                name: "Olive oil",
                quantity: 2,
                unit: "tbsp",
                nutrients: { calories: 239 },
                source_type: "usda",
            },
        ],
        instructions: [
            "Heat the oven to 425°F and line a sheet pan.",
            "Toss broccoli with olive oil, garlic, and lemon juice; spread on the pan.",
            "Place salmon on top; roast 14–16 minutes, until it flakes.",
        ],
    },
};

const PRODUCT_POLICY = {
    premiumPriceMonthlyCents: 300,
    householdMemberPriceMonthlyCents: 200,
    householdMemberLimit: 6,
};

/** S6 slice 3: Monday (UTC) of the current week — the week the
 * packaged app renders for the fixture profile (timezone UTC). */
function mondayOfCurrentWeek(): string {
    const today = new Date().toISOString().slice(0, 10);
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
}

function plannedMealFixture() {
    return {
        planned_meal_id: "fixture-planned-meal",
        planned_date: mondayOfCurrentWeek(),
        recipe_name: "Fixture chicken bowls",
        meal_slot: "dinner",
        ownership: "personal",
        created_by: null,
        servings: 2,
        version: 3,
        nutrition_per_serving: { calories: 600, protein_g: 40 },
    };
}

function planDraftFixture(status: "draft" | "committed") {
    const monday = mondayOfCurrentWeek();
    const sunday = new Date(`${monday}T12:00:00Z`);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    return {
        id: "fixture-plan-draft",
        version: status === "draft" ? 1 : 2,
        status,
        mode: "saved_only",
        start_date: monday,
        end_date: sunday.toISOString().slice(0, 10),
        scope: { type: "personal" },
        items: [
            {
                position: 0,
                date: monday,
                meal_slot: "lunch",
                source_type: "saved",
                recipe_id: "fixture-recipe-1",
                recipe_revision_id: "fixture-revision-1",
                nutrition_status: "complete",
                nutrition: {
                    per_serving: {
                        calories: 500,
                        protein_g: 30,
                        carbs_g: 40,
                        fat_g: 15,
                    },
                },
                blockers: [],
                warnings: [],
            },
        ],
    };
}

const GUIDANCE_PREFERENCES_FIXTURE = {
    version: 1,
    objective: "track_only",
    suggestions_enabled: true,
    allergies: [],
    excluded_ingredients: [],
    disliked_ingredients: [],
    liked_ingredients: [],
    cuisines: [],
    flavors: [],
    equipment: [],
    preferred_methods: [],
    avoided_methods: [],
    difficulty: "any",
    max_prep_minutes: null,
    max_total_minutes: null,
    servings: 1,
    repeat_window_days: 7,
    allow_repeats: true,
};

const PROFILE = { timezone: "UTC", preferred_weight_unit: "lb" };

function bootstrapFixture() {
    return {
        profile: PROFILE,
        productPolicy: PRODUCT_POLICY,
        capabilities: {
            entitlementSource: "android_free_baseline",
            tier: "free",
            recipeWrite: true,
            householdRecipeWrite: false,
        },
        household: null,
        // ADS-FOUNDATION: bootstrap carries the remote ads flag,
        // DEFAULT OFF (MUNCH_ADS_ENABLED unset on the server).
        ads: { enabled: false },
        user: { email: "parity-fixture@example.test" },
        androidEntitlements: { adFree: false },
        // ADS-FOUNDATION contract: bootstrap.ads.enabled is the
        // server-driven remote flag (DEFAULT OFF — absent unless the
        // server explicitly enables it).
        ...(adsFlagOn ? { ads: { enabled: true } } : {}),
    };
}

function settingsFixture() {
    return {
        ...bootstrapFixture(),
        goals: {},
        subscription:
            settingsVariant === "android-free-stripe"
                ? { provider: "stripe", status: "active" }
                : null,
        androidEntitlements: { adFree: false },
        connections: connectionsFixture,
    };
}

/** S6 slice 9: the PR #207 read model, as the Settings section consumes it. */
function signInMethodsFixture() {
    const email = {
        id: "email",
        label: "Email link",
        state: "linked",
        configured: true,
        maskedIdentity: "p•••@example.test",
        removable: false,
        canLink: false,
    };
    if (signInMethodsVariant === "linkable") {
        return {
            methods: [
                email,
                {
                    id: "google",
                    label: "Google",
                    state: "not_linked",
                    configured: true,
                    maskedIdentity: null,
                    removable: false,
                    canLink: true,
                },
                {
                    id: "apple",
                    label: "Apple",
                    state: "not_linked",
                    configured: true,
                    maskedIdentity: null,
                    removable: false,
                    canLink: true,
                },
            ],
        };
    }
    return {
        methods: [
            email,
            googleUnlinked
                ? {
                      id: "google",
                      label: "Google",
                      state: "not_linked",
                      configured: true,
                      maskedIdentity: null,
                      removable: false,
                      canLink: true,
                  }
                : {
                      id: "google",
                      label: "Google",
                      state: "linked",
                      configured: true,
                      maskedIdentity: "a•••@gmail.com",
                      removable: true,
                      canLink: false,
                  },
            {
                id: "apple",
                label: "Apple",
                state: "not_configured",
                configured: false,
                maskedIdentity: null,
                removable: false,
                canLink: false,
            },
        ],
    };
}

function householdFixture() {
    if (householdVariant === "none" || householdGone) {
        return {
            household: null,
            entitlementSource: "android_free_baseline",
            tier: "free",
            canCreateHousehold: true,
        };
    }
    // S6 slice 8: three people (the tightened mock's member count) and
    // one pending invitation, so the fused list, the pending warn row
    // and the revoke flow all render against the fixture.
    const members = [
        {
            membershipId: "fixture-membership-owner",
            displayName: "Fixture Owner",
            role: "owner",
            joinedAt: "2026-11-01T00:00:00.000Z",
        },
        {
            membershipId: "fixture-membership-member",
            displayName: "Fixture Member",
            role: "member",
            joinedAt: "2026-11-02T00:00:00.000Z",
        },
        {
            membershipId: "fixture-membership-viewer",
            displayName: "Fixture Viewer",
            role: "viewer",
            joinedAt: "2026-11-03T00:00:00.000Z",
        },
    ].filter(
        (member) =>
            !householdMemberRemoved ||
            member.membershipId !== "fixture-membership-member",
    );
    if (householdVariant === "member") {
        return {
            household: {
                role: "member",
                householdName: "Fixture Household",
                displayName: "Fixture Member",
            },
            entitlementSource: "household_subscription",
            tier: "premium",
            canCreateHousehold: false,
            canInvite: false,
            canWrite: true,
            activeNonOwnerCount: 2,
            seatCoverage: true,
            pendingInvitations: [],
            members,
        };
    }
    return {
        household: {
            role: "owner",
            householdName: "Fixture Household",
            displayName: "Fixture Owner",
        },
        entitlementSource: "android_free_baseline",
        tier: "free",
        canCreateHousehold: false,
        canInvite: true,
        canWrite: true,
        activeNonOwnerCount: 0,
        seatCoverage: true,
        pendingInvitations: householdInviteRevoked
            ? []
            : [
                  {
                      invitationId: "fixture-invitation-1",
                      email: "guest@example.com",
                      role: "member",
                      createdAt: "2026-11-08T00:00:00.000Z",
                      expiresAt: "2026-11-15T00:00:00.000Z",
                      androidFreeAccess: true,
                  },
              ],
        members,
    };
}

const PHOTO_DRAFT = {
    id: "fixture-photo-draft",
    status: "awaiting_confirmation",
    description: "Fixture photo meal",
    version: 1,
    meal_type: "lunch",
    logged_at: "2026-11-09T12:00:00.000Z",
    notes: "",
    source_mode: "photo",
    expires_at: null,
    totals: { calories: 480, protein_g: 30, carbs_g: 50, fat_g: 18 },
    questions: [],
    items: [
        {
            name: "Fixture rice bowl",
            source_type: "usda",
            confidence: 0.9,
            portion_label: "1 bowl",
            quantity: 1,
            gram_weight: 300,
            nutrients: { calories: 480, protein_g: 30, carbs_g: 50, fat_g: 18 },
            provider: "USDA",
            assumptions: [],
        },
    ],
};

function fixtureJson(pathname: string, method: string): unknown | undefined {
    if (pathname === "/api/app/bootstrap") return bootstrapFixture();
    // Pantry page bootstrap (chat v2 placement journey): settings
    // unlocks the workspace; the inventory payload is minimal.
    if (pathname === "/api/app/pantry/settings" && method === "GET") {
        return { enabled: true, household_available: false };
    }
    if (pathname === "/api/app/pantry" && method === "GET") {
        return { items: [] };
    }
    if (pathname === "/api/app/chat" && method === "GET") {
        return {
            premium: true,
            conversation: chatConversationFixture(chatSeedSurface),
            messages: chatSent
                ? [CHAT_USER_MESSAGE, CHAT_ASSISTANT_MESSAGE]
                : [],
            seed: chatSeedSurface ? CHAT_SEED_FIXTURES[chatSeedSurface] : null,
        };
    }
    if (pathname === "/api/app/chat/messages" && method === "POST") {
        chatSent = true;
        return {
            premium: true,
            conversation: {
                ...chatConversationFixture(chatSeedSurface),
                title: "Log 150 g grilled chicken and a moon soup for lunch",
                updatedAt: "2026-11-10T12:00:05.000Z",
            },
            user_message: CHAT_USER_MESSAGE,
            assistant_message: CHAT_ASSISTANT_MESSAGE,
            draft: CHAT_DRAFT,
        };
    }
    if (pathname === "/api/app/chat/conversations" && method === "POST") {
        // Reached only if the server-block handler did not consume
        // the request (it reads the body for the surface); the
        // unseeded shape is the safe default.
        chatSent = false;
        chatSeedSurface = null;
        return {
            premium: true,
            conversation: chatConversationFixture(null),
            messages: [],
            seed: null,
        };
    }
    if (pathname === "/api/app/meal-drafts/fixture-chat-draft") {
        return { draft: CHAT_DRAFT };
    }
    if (pathname === "/api/app/today") {
        const waterEntries = [
            {
                id: "fixture-water-1",
                amount_ml: 500,
                logged_at: "2026-11-09T08:15:00.000Z",
                loggedOn: "2026-11-09",
                notes: "",
            },
            {
                id: "fixture-water-2",
                amount_ml: 750,
                logged_at: "2026-11-09T12:30:00.000Z",
                loggedOn: "2026-11-09",
                notes: "With lunch",
            },
        ].filter((entry) => !vitalsRemovedIds.has(entry.id));
        const weightEntries = [
            {
                id: "fixture-weight-1",
                value: 182.4,
                unit: "lb",
                logged_at: "2026-11-09T07:00:00.000Z",
                loggedOn: "2026-11-09",
                notes: "",
            },
        ].filter((entry) => !vitalsRemovedIds.has(entry.id));
        return {
            totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
            meals: [],
            water: vitalsOnToday
                ? { entries: waterEntries, totalMl: 1250 }
                : { entries: [], totalMl: 0 },
            weight: vitalsOnToday ? weightEntries : [],
            goals: {},
            drafts: pendingDraftOnToday
                ? [
                      {
                          id: "fixture-pending-draft",
                          description: "Fixture pending meal",
                          status: "awaiting_confirmation",
                          openQuestionCount: 0,
                          itemCount: 1,
                          sourceMode: "photo",
                      },
                  ]
                : [],
            plannedMeals: [],
        };
    }
    if (pathname === "/api/app/meal-drafts/fixture-pending-draft") {
        return {
            draft: { ...PHOTO_DRAFT, id: "fixture-pending-draft" },
        };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-pending-draft/cancel" &&
        method === "POST"
    ) {
        pendingDraftOnToday = false;
        return {
            draft: {
                ...PHOTO_DRAFT,
                id: "fixture-pending-draft",
                status: "cancelled",
                version: PHOTO_DRAFT.version + 1,
            },
        };
    }
    if (pathname === "/api/app/guidance/today") {
        return {
            source_status: "sparse_data",
            objective: "Track only",
            actions: [],
        };
    }
    if (pathname === "/api/app/settings") return settingsFixture();
    if (pathname === "/api/app/sign-in-methods" && method === "GET") {
        return signInMethodsFixture();
    }
    if (
        pathname === "/api/app/sign-in-methods/google/link" &&
        method === "POST"
    ) {
        return { url: `${baseURL}/provider-consent-fixture`, redirect: true };
    }
    if (
        pathname === "/api/app/sign-in-methods/google/unlink" &&
        method === "POST"
    ) {
        googleUnlinked = true;
        return { status: true, methods: signInMethodsFixture().methods };
    }
    if (pathname === "/api/app/account" && method === "DELETE") {
        // The real lifecycle route (src/accounts/lifecycle-routes.ts)
        // answers { deleted: true } once the typed confirmation in the
        // request body matches; the fixture mirrors that success shape.
        return { deleted: true };
    }
    if (pathname === "/api/app/household/manage") return householdFixture();
    if (pathname === "/api/app/meals") return { meals: [], totals: {} };
    if (pathname === "/api/app/foods") {
        return { foods: [], savedFoods: [], total: 0 };
    }
    if (pathname === "/api/app/recipes") return { recipes: [] };
    if (pathname === "/api/app/recipes/fixture-salmon") {
        return RECIPE_DETAIL_FIXTURE;
    }
    if (pathname === "/api/app/planning") {
        return {
            plannedMeals: [plannedMealFixture()],
            recipes: recipeArchived
                ? RECIPE_FIXTURES.filter(
                      (recipe) => recipe.recipe_id !== "fixture-salmon",
                  )
                : RECIPE_FIXTURES,
            permissions: { personal: true, household: false },
            groceries: groceryFixture(),
        };
    }
    if (
        pathname === "/api/app/planning/fixture-planned-meal/swaps" &&
        method === "GET"
    ) {
        return {
            planned_meal_id: "fixture-planned-meal",
            expected_version: 3,
            current: { recipe_name: "Fixture chicken bowls" },
            candidates: [
                {
                    recipe_id: "fixture-recipe-2",
                    recipe_revision_id: "fixture-revision-2",
                    recipe_name: "Fixture salmon",
                    nutrition_status: "complete",
                    calories_per_serving: 550,
                    calories_delta_per_serving: -50,
                    protein_g_per_serving: 35,
                    protein_delta_per_serving: -5,
                    warnings: [],
                },
            ],
        };
    }
    if (
        pathname === "/api/app/planning/fixture-planned-meal/swap" &&
        method === "POST"
    ) {
        return {
            change: { id: "fixture-swap-1" },
            planned_meal: { version: 4 },
        };
    }
    if (
        pathname === "/api/app/planning/swaps/fixture-swap-1/undo" &&
        method === "POST"
    ) {
        return {};
    }
    if (pathname === "/api/app/guidance/context") {
        return {
            scope: { type: "personal" },
            preferences: { servings: 1 },
            saved_recipes: [
                {
                    id: "fixture-recipe-1",
                    recipe_revision_id: "fixture-revision-1",
                    name: "Fixture chili",
                },
            ],
            current_plan: [],
        };
    }
    if (pathname === "/api/app/guidance/preferences" && method === "GET") {
        return { preferences: GUIDANCE_PREFERENCES_FIXTURE };
    }
    if (pathname === "/api/app/guidance/preferences" && method === "PUT") {
        return {
            preferences: { ...GUIDANCE_PREFERENCES_FIXTURE, version: 2 },
        };
    }
    if (pathname === "/api/app/planning/drafts" && method === "POST") {
        return { draft: planDraftFixture("draft") };
    }
    if (
        pathname === "/api/app/planning/drafts/fixture-plan-draft/commit" &&
        method === "POST"
    ) {
        return { draft: planDraftFixture("committed") };
    }
    if (
        pathname === "/api/app/planning/drafts/fixture-plan-draft" &&
        method === "DELETE"
    ) {
        return {};
    }
    if (
        pathname === "/api/app/planning/drafts/fixture-plan-draft/groceries" &&
        method === "GET"
    ) {
        return {
            suggestions: [
                {
                    index: 0,
                    name: "Fixture rice",
                    quantity: 2,
                    unit: "kg",
                    recipes: ["Fixture chili"],
                    already_on_list: false,
                },
            ],
        };
    }
    if (
        pathname ===
            "/api/app/planning/drafts/fixture-plan-draft/groceries/commit" &&
        method === "POST"
    ) {
        return { addedCount: 1 };
    }
    if (pathname === "/api/app/guidance/goals/review") {
        return {
            status: "no_revision",
            objective: "Track only",
            rationale: "Fixture review.",
            evidence: {
                logged_nutrition_days: 0,
                weight_measurements: 0,
                weight_measurement_span_days: 0,
            },
        };
    }
    if (pathname === "/api/app/guidance/goals/history") return [];
    if (pathname === "/api/app/groceries") {
        return { groceries: [], permissions: {} };
    }
    if (pathname === "/api/app/cooks") {
        const cooks = COOK_FIXTURES.filter(
            (cook) => !(cookDeleted && cook.id === "fixture-chicken-rice"),
        ).map((cook) =>
            cookFinished && cook.id === "fixture-chicken-rice"
                ? { ...cook, status: "finished" }
                : cook,
        );
        return { cooks };
    }
    if (pathname === "/api/app/cooks/fixture-chicken-rice") {
        return cookDetailFixture();
    }
    if (
        pathname === "/api/app/cooks/fixture-chicken-rice/finish" &&
        method === "POST"
    ) {
        cookFinished = true;
        return {};
    }
    if (pathname === "/api/app/trends") {
        return trendsWorkspaceFixture();
    }
    if (pathname === "/api/app/trends/layout" && method === "GET") {
        return { layout: trendsLayoutFixture };
    }
    if (pathname === "/api/app/trends/day") {
        return {
            kind: "nutrient",
            metric: "calories",
            label: "Calories",
            unit: "kcal",
            total: 2140,
            reference: null,
            meals: [
                {
                    id: "fixture-meal-1",
                    description: "Chicken plate",
                    mealType: "lunch",
                    loggedAt: "2026-11-05T12:30:00.000Z",
                    total: 1240,
                    items: [{ name: "Grilled chicken breast", value: 1240 }],
                },
                {
                    id: "fixture-meal-2",
                    description: "Oats and berries",
                    mealType: "breakfast",
                    loggedAt: "2026-11-05T08:00:00.000Z",
                    total: 900,
                    items: [{ name: "Rolled oats", value: 900 }],
                },
            ],
            summary: {
                calories: 2140,
                proteinG: 119,
                mealCount: 2,
                waterMl: 1600,
            },
        };
    }
    if (pathname === "/api/app/trends/contributors") {
        return {
            metric: "protein_g",
            label: "Protein",
            unit: "g",
            foods: [
                {
                    name: "Grilled Chicken Breast",
                    value: 212,
                    lastDate: "2026-11-09",
                },
                { name: "Greek Yogurt", value: 96, lastDate: "2026-11-08" },
            ],
        };
    }
    if (pathname === "/api/app/insights/checkin") {
        return {
            coverage_percent: 86,
            calendar_days: 7,
            nutrition_target_coverage_days: 6,
            averages_on_recorded_days: {
                calories: { value: 1940 },
                protein_g: { average: 128 },
            },
            uncertain_nutrition_meals: 2,
            observations: [
                "Six of the last seven days have recorded nutrition.",
                "Two meals in this week carry uncertain nutrition.",
            ],
        };
    }
    if (pathname === "/api/app/food-search") {
        return { candidates: [], savedFoods: [], recentMealItems: [] };
    }
    if (pathname === "/api/app/meal-drafts/fixture-photo-draft") {
        return { draft: PHOTO_DRAFT };
    }
    if (pathname === "/api/app/export" && method === "POST") {
        return {
            recordCount: 42,
            url: `${baseURL}/exports/download?token=fixture-account`,
        };
    }
    if (pathname === "/api/app/export/meals" && method === "POST") {
        return {
            count: 3,
            url: `${baseURL}/exports/download?token=fixture-meals`,
        };
    }
    if (pathname === "/billing/portal" && method === "POST") {
        return { url: `${baseURL}/website-portal-fixture` };
    }
    if (pathname === "/api/app/meal-photo" && method === "POST") {
        return { draft: { id: "fixture-photo-draft" } };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-photo-draft/add-text" &&
        method === "POST"
    ) {
        return {
            draft: {
                ...PHOTO_DRAFT,
                version: 2,
                items: [
                    ...PHOTO_DRAFT.items,
                    {
                        name: "Butter",
                        source_type: "usda",
                        confidence: 0.8,
                        portion_label: "1 tbsp",
                        quantity: 1,
                        gram_weight: 14,
                        nutrients: {
                            calories: 100,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 12,
                        },
                        provider: "USDA",
                        assumptions: ["A good bit, taken as 1 tbsp"],
                    },
                ],
                totals: {
                    calories: 580,
                    protein_g: 30,
                    carbs_g: 50,
                    fat_g: 30,
                },
            },
            add: { status: "added", message: "Added butter to the draft." },
        };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-photo-draft/confirm" &&
        method === "POST"
    ) {
        return { meal: { id: "fixture-meal" } };
    }
    return undefined;
}

test.beforeAll(async () => {
    if (!existsSync(join(bundleDir, "index.html"))) {
        throw new Error(
            ".mobile-web bundle is missing — run `bun run mobile:web` before this spec",
        );
    }
    server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        const method = request.method ?? "GET";
        if (
            url.pathname.startsWith("/api/") ||
            url.pathname === "/billing/portal" ||
            url.pathname.startsWith("/account/")
        ) {
            observed.push({ method, path: url.pathname, search: url.search });
            if (
                method === "GET" &&
                url.pathname === "/api/app/chat" &&
                chatVariant === "free"
            ) {
                // The S8 gate, verbatim shape: 403 + the honest
                // Premium explanation (src/chat/entitlement.ts).
                response.writeHead(403, {
                    "content-type": "application/json",
                });
                response.end(
                    JSON.stringify({
                        error: "premium_required",
                        message:
                            "The Munch chat agent is part of Munch Premium ($2.99/month) — one of three Premium features, alongside ad-free in the app and MCP access. Every other Munch feature, including photo logging, meal ideas, meal plans, and recipe import, is free. Premium is managed on the Munch website: open https://munch.business, sign in with this same account, and manage Premium from Settings → Plan & billing there. No purchase can be started from this chat surface.",
                        premium_required: true,
                        subscribe_url:
                            "https://munch.business/app/settings/billing",
                    }),
                );
                return;
            }
            if (
                method === "POST" &&
                url.pathname === "/api/app/chat/conversations"
            ) {
                // Chat v2: the client posts { surface } when entering
                // from a contextual entry; the fixture answers with
                // that surface's seeded conversation + seed, exactly
                // the shape src/chat/service.ts returns.
                const chunks: Buffer[] = [];
                request.on("data", (chunk) => chunks.push(chunk as Buffer));
                request.on("end", () => {
                    let surface: string | null = null;
                    try {
                        const parsed = JSON.parse(
                            Buffer.concat(chunks).toString("utf8") || "{}",
                        ) as { surface?: unknown };
                        if (
                            typeof parsed.surface === "string" &&
                            CHAT_SEED_FIXTURES[parsed.surface]
                        ) {
                            surface = parsed.surface;
                        }
                    } catch {
                        surface = null;
                    }
                    chatSeedSurface = surface;
                    chatSent = false;
                    response.writeHead(200, {
                        "content-type": "application/json",
                        "cache-control": "no-store",
                    });
                    response.end(
                        JSON.stringify({
                            premium: true,
                            conversation: chatConversationFixture(surface),
                            messages: [],
                            seed: surface ? CHAT_SEED_FIXTURES[surface] : null,
                        }),
                    );
                });
                return;
            }
            if (
                method === "POST" &&
                url.pathname === "/api/app/sign-in-methods/google/unlink" &&
                signInMethodsVariant === "refusal"
            ) {
                // PR #207's last-method guardrail, verbatim shape:
                // 409 + { error, message } and nothing changes.
                response.writeHead(409, {
                    "content-type": "application/json",
                });
                response.end(
                    JSON.stringify({
                        error: "last_sign_in_method",
                        message:
                            "You can't unlink Google — it's the only sign-in method left on this account. Link another sign-in method first, then unlink Google.",
                    }),
                );
                return;
            }
            // S6 slice 8: household lifecycle posts live outside /api/
            // (the portal's /account/household/* routes). The fixture
            // records the state change the real routes would persist,
            // so the fused confirm flows re-render against it.
            if (
                method === "POST" &&
                url.pathname === "/account/household/member/remove"
            ) {
                householdMemberRemoved = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "POST" &&
                url.pathname === "/account/household/invite/revoke"
            ) {
                householdInviteRevoked = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "POST" &&
                (url.pathname === "/account/household/leave" ||
                    url.pathname === "/account/household/dissolve")
            ) {
                householdGone = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/recipes/")
            ) {
                recipeArchived = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/cooks/")
            ) {
                cookDeleted = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                (url.pathname.startsWith("/api/app/water/") ||
                    url.pathname.startsWith("/api/app/weight/"))
            ) {
                vitalsRemovedIds.add(
                    decodeURIComponent(url.pathname.split("/").at(-1) ?? ""),
                );
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/connections/")
            ) {
                connectionsFixture = [];
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/groceries/items/")
            ) {
                groceryRemovedIds.add(
                    decodeURIComponent(
                        url.pathname.slice("/api/app/groceries/items/".length),
                    ),
                );
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "POST" &&
                url.pathname === "/api/app/groceries/clear-purchased"
            ) {
                groceryCleared = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end(JSON.stringify({ clearedCount: 1 }));
                return;
            }
            if (method === "PUT" && url.pathname === "/api/app/trends/layout") {
                // Trends layout persistence: the mock server is the
                // account store — a saved layout rebuilds the
                // workspace fixture on the next read, like the real
                // server-side preference row.
                const chunks: Buffer[] = [];
                request.on("data", (chunk) => chunks.push(chunk as Buffer));
                request.on("end", () => {
                    try {
                        const parsed = JSON.parse(
                            Buffer.concat(chunks).toString("utf8") || "{}",
                        ) as {
                            layout?: { cards?: TrendsLayoutCard[] };
                        };
                        if (Array.isArray(parsed.layout?.cards)) {
                            trendsLayoutFixture = {
                                version: 1,
                                cards: parsed.layout.cards,
                            };
                        }
                    } catch {
                        // Keep the previous layout on a malformed body.
                    }
                    response.writeHead(200, {
                        "content-type": "application/json",
                    });
                    response.end(
                        JSON.stringify({ layout: trendsLayoutFixture }),
                    );
                });
                return;
            }
            const fixture = fixtureJson(url.pathname, method);
            response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
            });
            response.end(JSON.stringify(fixture ?? {}));
            return;
        }
        if (url.pathname === "/exports/download") {
            observed.push({ method, path: url.pathname, search: url.search });
            response.writeHead(200, {
                "content-type": "text/csv; charset=utf-8",
                "content-disposition":
                    'attachment; filename="fixture-export.csv"',
            });
            response.end("fixture,export\n1,2\n");
            return;
        }
        if (url.pathname === "/provider-consent-fixture") {
            response.writeHead(200, { "content-type": "text/html" });
            response.end(
                "<!doctype html><title>Provider consent</title><h1>Provider consent (fixture)</h1>",
            );
            return;
        }
        if (url.pathname === "/website-portal-fixture") {
            response.writeHead(200, { "content-type": "text/html" });
            response.end(
                "<!doctype html><title>Website billing</title><h1>Website subscription management (fixture)</h1>",
            );
            return;
        }
        const relative = normalize(decodeURIComponent(url.pathname)).replace(
            /^(\.\.[/\\])+|^[/\\]+/,
            "",
        );
        const filePath = join(
            bundleDir,
            relative === "" ? "index.html" : relative,
        );
        if (
            !filePath.startsWith(bundleDir) ||
            !existsSync(filePath) ||
            !statSync(filePath).isFile()
        ) {
            response.writeHead(404, { "content-type": "text/plain" });
            response.end("not found");
            return;
        }
        response.writeHead(200, {
            "content-type":
                MIME[extname(filePath)] ?? "application/octet-stream",
            "cache-control": "no-store",
        });
        response.end(readFileSync(filePath));
    });
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Static bundle server did not bind a port");
    }
    baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

/**
 * Test-only stand-in for the packaged mobile runtime — the S4 stub plus
 * S5 fidelity extensions (see the file header). The 1×1 PNG data URL is
 * what the stub camera "captures": meal-photo-native.js fetches it,
 * builds a real File, and hands it to the dialog's file input.
 */
const STUB_RUNTIME = `
export {
    getMunchPlatformKind,
    installOfflineBanner,
    isConnectivityError,
    isOffline,
    requestJson,
    resolveMunchApiUrl,
} from "./app-api.js";
window.MunchAds = Object.freeze({
    setBannerVisible: async (options) => {
        (window.__adCalls ??= []).push(options);
        return {};
    },
    showPrivacyOptions: async () => ({ available: false }),
});
export function installedReturnRoute() {
    return "/app";
}
export function currentInstalledAppRoute() {
    return "/app";
}
export function installedLoginUrl() {
    return "/mobile-login.html";
}
export async function restoreInstalledEntryRoute() {
    return "/app";
}
export async function hasStoredSession() {
    return true;
}
export async function getInstalledPlayBillingConfig() {
    return window.__fixturePlayBilling ?? { configured: false };
}
export async function getInstalledPremiumProduct() {
    throw new Error("Play Billing is not configured in the bundle e2e");
}
export async function purchaseInstalledPremium() {
    throw new Error("Play Billing is not configured in the bundle e2e");
}
export async function restoreInstalledPremium() {
    return { state: "unavailable" };
}
export async function openInstalledSubscriptionManagement() {
    window.__openedSubscriptionManagement = true;
    return null;
}
const FIXTURE_PHOTO =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
export async function takeInstalledPhoto() {
    return { webPath: FIXTURE_PHOTO, metadata: { format: "png" } };
}
export async function chooseInstalledPhoto() {
    return { webPath: FIXTURE_PHOTO, metadata: { format: "png" } };
}
`;

async function bootPackagedApp(page: import("@playwright/test").Page) {
    await page.route(/\/mobile-runtime\.js$/, (route) =>
        route.fulfill({ contentType: "text/javascript", body: STUB_RUNTIME }),
    );
    page.on("dialog", (dialog) => void dialog.accept());
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
}

async function gotoRoute(page: import("@playwright/test").Page, href: string) {
    const link = page.locator(`a[href="${href}"]:visible`).first();
    if ((await link.count()) > 0) {
        await link.click();
        return;
    }
    await page.evaluate((target) => {
        history.pushState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }, href);
}

function observedRequest(method: string, path: string): boolean {
    return observed.some(
        (entry) => entry.method === method && entry.path === path,
    );
}

test.beforeEach(() => {
    observed.length = 0;
    signInMethodsVariant = "default";
    googleUnlinked = false;
    settingsVariant = "android-free";
    householdVariant = "none";
    pendingDraftOnToday = false;
    adsFlagOn = false;
    recipeArchived = false;
    groceryCleared = false;
    groceryRemovedIds.clear();
    householdMemberRemoved = false;
    householdInviteRevoked = false;
    householdGone = false;
    chatVariant = "premium";
    chatSent = false;
    chatSeedSurface = null;
    cookFinished = false;
    cookDeleted = false;
    vitalsRemovedIds.clear();
    trendsLayoutFixture = defaultTrendsLayout();
    vitalsOnToday = false;
    connectionsFixture = [
        {
            clientName: "Fixture MCP Client",
            clientId: "fixture-client",
            tokenFamilyId: "fixture-family-1",
            activeAccessTokens: 1,
            expiresAt: "2027-01-01T00:00:00.000Z",
        },
    ];
});

test("every app-channel entry point ships inside the packaged bundle", async () => {
    const bundleFiles = [
        "app.js",
        "app-account.js",
        "app-patches.js",
        "app-integrity.js",
        "pantry.js",
        "mobile-runtime.js",
        "mobile-entry.js",
        "billing-native.js",
        "meal-photo-native.js",
        "pantry-native.js",
        "index.html",
        "pantry.html",
    ];
    const bundleText = bundleFiles
        .map((file) => readFileSync(join(bundleDir, file), "utf8"))
        .join("\n");

    const problems: string[] = [];
    for (const capability of CAPABILITY_MANIFEST) {
        if (capability.app.coverage === "missing") continue;
        for (const entryPoint of capability.app.entryPoints) {
            // Entry points carry a method prefix (sometimes combined,
            // "GET/PUT …") and occasionally a trailing "(annotation)".
            const withoutMethod = entryPoint
                .replace(/\s*\([^)]*\)\s*$/, "")
                .replace(/^[A-Z]+(?:\/[A-Z]+)* /, "");
            if (withoutMethod.startsWith("[")) {
                // Selector entry point, e.g. [data-action="log-by-photo"],
                // [data-action=compose-recipe] (unquoted in the manifest)
                // or a bare attribute selector like [data-patch-food].
                const inner = withoutMethod.slice(1, -1);
                const value = inner.match(/=([^"'\]]+)$/)?.[1];
                if (!bundleText.includes(value ?? inner)) {
                    problems.push(`${capability.id}: ${entryPoint}`);
                }
                continue;
            }
            if (withoutMethod.startsWith("#")) {
                // DOM id entry point, e.g. #meal-history-search.
                if (!bundleText.includes(withoutMethod.slice(1))) {
                    problems.push(`${capability.id}: ${entryPoint}`);
                }
                continue;
            }
            // Path entry point: template-built URLs split on :params, so
            // assert each static segment around the params.
            const segments = withoutMethod
                .split(/:[A-Za-z]+/)
                .map((segment) => segment.replace(/\?.*$/, ""))
                .filter((segment) => segment.length >= 4);
            for (const segment of segments) {
                // A trailing segment may be built from a variable rather
                // than a literal (cook lifecycle posts to
                // `/api/app/cooks/${id}/${verb}` with verb "finish" /
                // "reopen"), so a quoted occurrence of the bare segment
                // word also proves the path is constructed in the bundle.
                const bareWord = segment.replace(/^\//, "");
                if (
                    !bundleText.includes(segment) &&
                    !bundleText.includes(`"${bareWord}"`)
                ) {
                    problems.push(
                        `${capability.id}: ${entryPoint} (segment ${segment})`,
                    );
                }
            }
        }
    }
    expect(problems).toEqual([]);
});

test("packaged route sweep renders every Operate surface", async ({ page }) => {
    await bootPackagedApp(page);

    const surfaces: { href: string; landmark: RegExp }[] = [
        { href: "/app/log", landmark: /Food log|Meals/i },
        { href: "/app/trends", landmark: /Trends|The week in words/i },
        { href: "/app/foods", landmark: /Saved foods|Foods/i },
        { href: "/app/recipes", landmark: /Recipes/i },
        { href: "/app/cooks", landmark: /Cooks/i },
        { href: "/app/plan", landmark: /Week of/i },
        { href: "/app/groceries", landmark: /Groceries/i },
        { href: "/app/chat", landmark: /thinking partner|Chat/i },
        { href: "/app/more", landmark: /More|Settings/i },
        { href: "/app/settings", landmark: /Settings/i },
        { href: "/app/settings/profile", landmark: /Profile/i },
        { href: "/app/settings/goals", landmark: /Nutrition targets|Goals/i },
        { href: "/app/settings/account", landmark: /Account/i },
    ];
    for (const surface of surfaces) {
        await gotoRoute(page, surface.href);
        await expect(page.locator("#app-content")).toContainText(
            surface.landmark,
        );
        await expect(page.getByTestId("api-down-state")).toHaveCount(0);
        await expect(page.locator(".error-state")).toHaveCount(0);
    }

    // Pantry is the second packaged page (its own shell + script).
    await page.goto(`${baseURL}/pantry.html`);
    await expect(page).toHaveTitle(/Pantry/);
});

test("household.manage lives inside the packaged app", async ({ page }) => {
    householdVariant = "none";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/household");
    // No-household state: the Android variant of the create form renders
    // in the packaged SPA (household sharing included, no charge copy).
    await expect(page.locator("#household-create-form")).toBeVisible();
    await expect(page.locator("#app-content")).toContainText(
        "Household sharing is included on Android",
    );
    expect(observedRequest("GET", "/api/app/household/manage")).toBe(true);

    householdVariant = "owner";
    await gotoRoute(page, "/app");
    await gotoRoute(page, "/app/household");
    await expect(page.locator("#app-content")).toContainText(
        "Fixture Household",
    );
    await expect(page.locator("#app-content")).toContainText("Fixture Member");
    await expect(page.locator("#household-invite-form")).toBeVisible();
});

test("S6 slice 8: Household renders fused member rows with no ad slot", async ({
    page,
}) => {
    householdVariant = "owner";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/household");

    // The fused list: three member rows (the tightened mock's count),
    // owner controls riding the two non-owner rows, the pending
    // invitation as a warn row with its Revoke action, and the invite
    // form below the list.
    const rows = page.locator(".household-member");
    await expect(rows).toHaveCount(3);
    await expect(
        page.locator('[data-action="household-member-remove"]'),
    ).toHaveCount(2);
    await expect(page.locator("#app-content")).toContainText(
        "guest@example.com",
    );
    await expect(
        page.locator('[data-action="household-invite-revoke"]'),
    ).toBeVisible();
    await expect(page.locator("#household-invite-form")).toBeVisible();

    // No ad slot on Household — not with the flag off, and not with
    // it on either (the app's only slot is on Today). The native
    // banner is never asked to show here.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/household");
    await expect(rows).toHaveCount(3);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);
});

test("S6 slice 8: Household destructive flows use inline confirmations, never the native dialog", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: every destructive
    // Household flow gated on the native window.confirm(), which
    // silently no-ops wherever that dialog is dismissed or never
    // answered. This test records AND dismisses every native dialog:
    // the flows must complete entirely through in-page UI, so on the
    // old code they fail twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    householdVariant = "owner";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/household");

    // Remove member: the first click only asks, in place after the row.
    const memberRow = page.locator(".household-member", {
        hasText: "Fixture Member",
    });
    const remove = memberRow.locator('[data-action="household-member-remove"]');
    await remove.click();
    const confirmRemove = page.locator(
        '[data-action="confirm-household-member-remove"]',
    );
    await expect(confirmRemove).toBeVisible();
    await expect(page.getByText("Remove Fixture Member?")).toBeVisible();
    expect(observedRequest("POST", "/account/household/member/remove")).toBe(
        false,
    );
    expect(nativeDialogs).toEqual([]);

    // "Keep member" restores the row's Remove action, still unsent.
    await page.locator('[data-action="dismiss-household-confirm"]').click();
    await expect(remove).toBeVisible();
    expect(observedRequest("POST", "/account/household/member/remove")).toBe(
        false,
    );

    // Confirming removes: the POST lands, the toast lands, row is gone.
    await remove.click();
    await confirmRemove.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Member removed and household billing updated.",
    );
    expect(observedRequest("POST", "/account/household/member/remove")).toBe(
        true,
    );
    await expect(page.locator(".household-member")).toHaveCount(2);
    expect(nativeDialogs).toEqual([]);

    // Revoke invite: the same pattern after the pending row.
    const revoke = page.locator('[data-action="household-invite-revoke"]');
    await revoke.click();
    const confirmRevoke = page.locator(
        '[data-action="confirm-household-invite-revoke"]',
    );
    await expect(confirmRevoke).toBeVisible();
    await expect(
        page.getByText("Revoke the invitation to guest@example.com?"),
    ).toBeVisible();
    expect(observedRequest("POST", "/account/household/invite/revoke")).toBe(
        false,
    );
    await page.locator('[data-action="dismiss-household-confirm"]').click();
    await expect(revoke).toBeVisible();
    await revoke.click();
    await confirmRevoke.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Invitation revoked.",
    );
    expect(observedRequest("POST", "/account/household/invite/revoke")).toBe(
        true,
    );
    await expect(page.locator(".pending-invite")).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);

    // Dissolve: the typed phrase still gates the flow, then the
    // inline confirmation replaces the native dialog.
    await page
        .locator("#dissolve-household-confirmation")
        .fill("DISSOLVE HOUSEHOLD");
    const dissolve = page.locator('[data-action="household-dissolve"]');
    await dissolve.click();
    const confirmDissolve = page.locator(
        '[data-action="confirm-household-dissolve"]',
    );
    await expect(confirmDissolve).toBeVisible();
    expect(observedRequest("POST", "/account/household/dissolve")).toBe(false);
    await page.locator('[data-action="dismiss-household-confirm"]').click();
    await expect(dissolve).toBeVisible();
    expect(observedRequest("POST", "/account/household/dissolve")).toBe(false);
    await dissolve.click();
    await confirmDissolve.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Household dissolved and paid member seats removed.",
    );
    expect(observedRequest("POST", "/account/household/dissolve")).toBe(true);
    // The household is gone: the Android create state renders.
    await expect(page.locator("#household-create-form")).toBeVisible();
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 8: leaving the household uses the inline confirmation", async ({
    page,
}) => {
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    householdVariant = "member";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/household");

    // Member view: the seat billing card renders, no owner controls
    // exist, and the danger group offers Leave instead of Dissolve.
    await expect(page.locator("#app-content")).toContainText(
        "Premium through household",
    );
    await expect(
        page.locator('[data-action="household-member-remove"]'),
    ).toHaveCount(0);
    const leave = page.locator('[data-action="household-leave"]');
    await leave.click();
    const confirmLeave = page.locator(
        '[data-action="confirm-household-leave"]',
    );
    await expect(confirmLeave).toBeVisible();
    await expect(page.getByText("Leave this household?")).toBeVisible();
    expect(observedRequest("POST", "/account/household/leave")).toBe(false);
    expect(nativeDialogs).toEqual([]);
    await page.locator('[data-action="dismiss-household-confirm"]').click();
    await expect(leave).toBeVisible();
    expect(observedRequest("POST", "/account/household/leave")).toBe(false);
    await leave.click();
    await confirmLeave.click();
    await expect(page.locator("#toast-region")).toContainText(
        "You left the household.",
    );
    expect(observedRequest("POST", "/account/household/leave")).toBe(true);
    await expect(page.locator("#household-create-form")).toBeVisible();
    expect(nativeDialogs).toEqual([]);
});

test("mcp.connection.revoke works inside the packaged app", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/connections");
    await expect(page.locator("#app-content")).toContainText(
        "Fixture MCP Client",
    );
    // S6 slice 9: revoke asks inline first (slice 1's pattern) — the
    // first click sends nothing; the inline confirm revokes.
    await page.locator('[data-action="connection-revoke"]').click();
    const confirmRevoke = page.locator(
        '[data-action="confirm-connection-revoke"]',
    );
    await expect(confirmRevoke).toBeVisible();
    expect(
        observedRequest("DELETE", "/api/app/connections/fixture-family-1"),
    ).toBe(false);
    await confirmRevoke.click();
    await expect(page.locator("#app-content")).toContainText(
        "No active connections",
    );
    expect(
        observedRequest("DELETE", "/api/app/connections/fixture-family-1"),
    ).toBe(true);
    await expect(page.locator("#toast-region")).toContainText(
        "Connection revoked.",
    );
});

test("account.export and nutrition.export hand off from the packaged app", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/data");
    await expect(page.locator("#app-content")).toContainText(
        "Export complete account data",
    );

    const accountDownload = page
        .waitForEvent("download", {
            timeout: 10_000,
        })
        .catch(() => null);
    await page.locator('[data-action="export-account"]').click();
    await expect
        .poll(() => observedRequest("POST", "/api/app/export"))
        .toBe(true);
    // The app navigates to the short-lived download URL the API returned.
    // In Chromium that surfaces as a download; on Android, Capacitor's
    // Bridge.launchIntent opens any non-localhost navigation in the
    // system browser, which performs the same download there.
    await accountDownload;
    await expect
        .poll(() => observedRequest("GET", "/exports/download"))
        .toBe(true);

    const mealsDownload = page
        .waitForEvent("download", {
            timeout: 10_000,
        })
        .catch(() => null);
    await page.locator('[data-action="export-meals"]').click();
    await expect
        .poll(() => observedRequest("POST", "/api/app/export/meals"))
        .toBe(true);
    await mealsDownload;
});

test("billing rows route honestly from the packaged app", async ({ page }) => {
    // Android-free account: the packaged billing page offers NO Stripe
    // checkout and NO Stripe portal — there is nothing to misroute.
    // Premium on Android is a Play concern (billing-native), and the
    // website-only rows stay website-only.
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/billing");
    await expect(page.locator("#app-content")).toContainText("Free on Android");
    await expect(page.locator('[data-action="billing-checkout"]')).toHaveCount(
        0,
    );
    await expect(page.locator('[data-action="billing-portal"]')).toHaveCount(0);

    // An account whose subscription lives on the website (Stripe): the
    // one billing action offered is honestly labelled as website
    // management, and using it posts to the website portal route and
    // navigates OUT to the URL it returns — no in-app Stripe surface.
    settingsVariant = "android-free-stripe";
    await gotoRoute(page, "/app");
    await gotoRoute(page, "/app/settings/billing");
    const portalButton = page.locator('[data-action="billing-portal"]');
    await expect(portalButton).toBeVisible();
    await expect(portalButton).toContainText(
        "Manage website and connected-client subscription",
    );
    await expect(page.locator('[data-action="billing-checkout"]')).toHaveCount(
        0,
    );
    await portalButton.click();
    await expect(page).toHaveURL(/\/website-portal-fixture/);
    expect(observedRequest("POST", "/billing/portal")).toBe(true);
});

test("S6 slice 9: Settings is themed, sign-in methods render every state, no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings");
    await expect(page.locator(".operate-view.settings-view")).toHaveCount(1);
    await expect(page.locator("#app-content")).toContainText(
        "Profile & preferences",
    );
    await expect(page.locator("#app-content")).toContainText("Plan & billing");

    // Profile carries the fused surface's preference controls.
    await gotoRoute(page, "/app/settings/profile");
    await expect(page.locator(".operate-view.settings-view")).toHaveCount(1);
    await expect(page.locator("#settings-timezone")).toBeVisible();
    await expect(
        page.locator('input[name="preferred_weight_unit"][value="lb"]'),
    ).toBeChecked();

    // Sign-in methods (Amendment I, PR #207 backend): Email linked
    // and never removable; Google linked with masked identity +
    // Unlink; Apple not-yet-configured — an honest line, no button.
    await gotoRoute(page, "/app/settings/account");
    const emailRow = page.locator('[data-sign-in-method="email"]');
    await expect(emailRow).toContainText("p•••@example.test");
    await expect(emailRow.locator("button")).toHaveCount(0);
    const googleRow = page.locator('[data-sign-in-method="google"]');
    await expect(googleRow).toContainText("a•••@gmail.com");
    await expect(
        googleRow.locator('[data-action="sign-in-method-unlink"]'),
    ).toBeVisible();
    const appleRow = page.locator('[data-sign-in-method="apple"]');
    await expect(appleRow).toContainText("Not set up for Munch yet");
    await expect(appleRow.locator("button")).toHaveCount(0);
    expect(observedRequest("GET", "/api/app/sign-in-methods")).toBe(true);

    // No ad slot on Settings — not with the flag off, not with it on.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/settings/account");
    await expect(page.locator('[data-sign-in-method="google"]')).toContainText(
        "a•••@gmail.com",
    );
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
});

test("S6 slice 9: linkable sign-in methods start the link flow", async ({
    page,
}) => {
    signInMethodsVariant = "linkable";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/account");
    const googleRow = page.locator('[data-sign-in-method="google"]');
    await expect(googleRow).toContainText("Not linked");
    await expect(
        page.locator(
            '[data-sign-in-method="apple"] [data-action="sign-in-method-link"]',
        ),
    ).toBeVisible();
    await googleRow.locator('[data-action="sign-in-method-link"]').click();
    expect(
        observedRequest("POST", "/api/app/sign-in-methods/google/link"),
    ).toBe(true);
    // Initiation hands off to the provider consent URL it returned.
    await expect(page).toHaveURL(/\/provider-consent-fixture/);
});

test("S6 slice 9 regression: unlink and account deletion use inline confirmation with no native confirm", async ({
    page,
}) => {
    // Dialog-dismissing regression (slices 1/3–6 pattern): every
    // native dialog is recorded AND dismissed, so all three flows
    // must complete entirely through in-page UI — on the old code
    // (native confirm gates) they fail twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);

    // Unlink: first click only asks; dismiss restores; confirm posts.
    await gotoRoute(page, "/app/settings/account");
    const googleRow = page.locator('[data-sign-in-method="google"]');
    const unlink = googleRow.locator('[data-action="sign-in-method-unlink"]');
    await unlink.click();
    const confirmUnlink = page.locator(
        '[data-action="confirm-sign-in-method-unlink"]',
    );
    await expect(confirmUnlink).toBeVisible();
    await expect(
        page.getByText("Unlink Google (a•••@gmail.com)?"),
    ).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/sign-in-methods/google/unlink"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);
    await page.locator('[data-action="dismiss-settings-confirm"]').click();
    await expect(unlink).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/sign-in-methods/google/unlink"),
    ).toBe(false);
    await unlink.click();
    await confirmUnlink.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Google unlinked.",
    );
    expect(
        observedRequest("POST", "/api/app/sign-in-methods/google/unlink"),
    ).toBe(true);
    await expect(googleRow).toContainText("Not linked");
    await expect(
        googleRow.locator('[data-action="sign-in-method-link"]'),
    ).toBeVisible();
    expect(nativeDialogs).toEqual([]);

    // Account deletion: the typed phrase stays the first gate, the
    // inline confirmation is the final say — nothing posts before it.
    await page
        .locator("#delete-account-confirmation")
        .fill("DELETE MY MUNCH ACCOUNT");
    const deleteButton = page.locator('[data-action="account-delete"]');
    await deleteButton.click();
    const confirmDelete = page.locator(
        '[data-action="confirm-account-delete"]',
    );
    await expect(confirmDelete).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/account")).toBe(false);
    await page.locator('[data-action="dismiss-settings-confirm"]').click();
    await expect(deleteButton).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/account")).toBe(false);
    await deleteButton.click();
    await confirmDelete.click();
    await expect
        .poll(() => observedRequest("DELETE", "/api/app/account"))
        .toBe(true);
    await expect(page).toHaveURL(/deleted=1/);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 9: the last-method unlink refusal surfaces plainly in the UI", async ({
    page,
}) => {
    signInMethodsVariant = "refusal";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/account");
    const googleRow = page.locator('[data-sign-in-method="google"]');
    await googleRow.locator('[data-action="sign-in-method-unlink"]').click();
    await page.locator('[data-action="confirm-sign-in-method-unlink"]').click();
    // The backend's 409 message itself is shown in the section —
    // not swallowed, not replaced with a generic failure — and the
    // method stays linked.
    const alert = page.locator("[data-sign-in-methods-alert]");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("only sign-in method left");
    await expect(alert).toContainText("Link another sign-in method first");
    await expect(googleRow).toContainText("a•••@gmail.com");
    await expect(
        googleRow.locator('[data-action="sign-in-method-unlink"]'),
    ).toBeVisible();
});

test("meal.photoLog runs end to end in the packaged bundle", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await page.locator('[data-action="log-by-photo"]:visible').first().click();

    // The S3 dialog renders in the bundle, and meal-photo-native.js has
    // enhanced it with the native capture actions (the packaged-only
    // wiring S4 added and S5 exists to exercise).
    await expect(page.locator("#meal-photo-file")).toBeAttached();
    const takePhoto = page.getByRole("button", { name: "Take photo" });
    await expect(takePhoto).toBeVisible();

    // Native capture: the stub camera returns a photo; the real native
    // module fetches it, builds a File and hands it to the dialog input.
    await takePhoto.click();
    await expect(page.locator("#meal-photo-status")).toContainText(
        "Photo added",
    );

    // Estimate: the packaged app posts the photo and lands in the draft
    // review — the full S3 pipeline surface, inside the bundle.
    await page.locator("#meal-photo-submit").click();
    await expect(page.locator("#meal-draft-review")).toContainText(
        "Fixture rice bowl",
    );
    expect(observedRequest("POST", "/api/app/meal-photo")).toBe(true);

    // Conversational add-to-draft (Amendment E) inside the same review.
    await expect(page.locator("#meal-draft-add-text-input")).toBeVisible();
    await page
        .locator("#meal-draft-add-text-input")
        .fill("I added a good bit of butter");
    await page.locator('[data-action="add-draft-text"]').click();
    await expect(page.locator("#meal-draft-review")).toContainText("Butter");
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-photo-draft/add-text",
        ),
    ).toBe(true);

    // Confirm-before-save: nothing logged until this click.
    await page.locator('[data-action="confirm-meal-draft"]').click();
    await expect(page.locator("#toast-region")).toContainText(
        "Meal confirmed and logged.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-photo-draft/confirm",
        ),
    ).toBe(true);
});

test("S6 slice 1 regression: Abandon draft dismisses a pending draft with no native confirm", async ({
    page,
}) => {
    // The 2026-11-09 production defect: "Abandon draft" gated on the
    // native window.confirm() dialog. Any environment that dismisses
    // or never answers that dialog (automated browsers by default,
    // WebViews without a JS-dialog handler) turned the click into a
    // silent no-op — no request, no feedback, draft still pending —
    // while the in-page Close worked. This test records AND dismisses
    // every native dialog: the abandon flow must complete entirely
    // through in-dialog UI, so on the old code it fails twice over
    // (a native confirm fires, and no inline confirmation exists).
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    pendingDraftOnToday = true;
    await bootPackagedApp(page);

    await page.getByRole("button", { name: "Review draft" }).click();
    const abandon = page.locator('[data-action="cancel-meal-draft"]');
    await expect(abandon).toBeVisible();
    await abandon.click();

    // In-dialog confirmation appears; nothing has been sent yet.
    const confirmAbandon = page.locator(
        '[data-action="confirm-cancel-meal-draft"]',
    );
    await expect(confirmAbandon).toBeVisible();
    await expect(
        page.getByText("Abandon this meal draft? No meal will be logged."),
    ).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep draft" restores the review actions without any request.
    await page.locator('[data-action="dismiss-abandon-draft"]').click();
    await expect(abandon).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(false);

    // Confirming abandons: cancel posts, the dialog closes, the toast
    // lands, and Today re-renders without the pending draft.
    await abandon.click();
    await confirmAbandon.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Meal draft abandoned.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(true);
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(
        page.getByRole("button", { name: "Review draft" }),
    ).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 1: the single ad slot lives on Today, flag-gated and Premium-hidden", async ({
    page,
}) => {
    // Flag OFF (the shipped default): no slot element at all on Today,
    // and the native banner is never asked to show.
    await bootPackagedApp(page);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    let adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    expect(adCalls.length).toBeGreaterThan(0);
    expect(
        adCalls.every(
            (call) =>
                (call as { visible?: boolean }).visible === false &&
                (call as { adsEnabled?: boolean }).adsEnabled === false,
        ),
    ).toBe(true);

    // Flag ON for a free packaged account: exactly one slot, in-flow
    // directly under Today's guidance and above Meals; the native
    // banner is requested visible with the flag forwarded.
    adsFlagOn = true;
    await page.reload();
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    const slot = page.locator('[data-testid="today-ad-slot"]');
    await expect(slot).toHaveCount(1);
    await expect(slot).toBeVisible();
    const slotBox = await slot.boundingBox();
    const guidanceBox = await page
        .getByRole("heading", { name: "Today’s guidance" })
        .boundingBox();
    const mealsBox = await page
        .getByRole("heading", { name: "Meals" })
        .boundingBox();
    expect(slotBox).not.toBeNull();
    expect(guidanceBox).not.toBeNull();
    expect(mealsBox).not.toBeNull();
    expect(slotBox!.y).toBeGreaterThanOrEqual(guidanceBox!.y);
    expect(slotBox!.y + slotBox!.height).toBeLessThanOrEqual(mealsBox!.y);
    // Slim and stable: the reserve is the mock's 54px grammar.
    expect(slotBox!.height).toBeGreaterThanOrEqual(54);
    expect(slotBox!.height).toBeLessThan(64);
    adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    expect(
        adCalls.some(
            (call) =>
                (call as { visible?: boolean }).visible === true &&
                (call as { adsEnabled?: boolean }).adsEnabled === true,
        ),
    ).toBe(true);

    // Nowhere else: the Food Log carries no slot and the banner hides.
    await gotoRoute(page, "/app/log");
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);
});

test("S6 slice 4: Recipes library rows carry View / Log / Add-to-plan and no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/recipes");

    // The fused library: one themed panel per recipe in the fixture,
    // each with the mock's three row actions.
    const panels = page.locator(".recipe-panel");
    await expect(panels).toHaveCount(4);
    await expect(panels.first()).toContainText("Lemon Herb Chicken & Rice");
    await expect(panels.first()).toContainText("512 kcal");
    const firstPanel = panels.first();
    await expect(
        firstPanel.locator('[data-action="view-recipe"]'),
    ).toBeVisible();
    await expect(
        firstPanel.locator('[data-action="log-recipe"]'),
    ).toBeVisible();
    await expect(
        firstPanel.locator('[data-action="plan-recipe"]'),
    ).toBeVisible();

    // No ad slot on Recipes — not with the flag off, and not with it on
    // either (the app's only slot is on Today; the Recipes placements
    // are retired). The native banner is never asked to show here.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/recipes");
    await expect(panels).toHaveCount(4);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);

    // Log-recipe and schedule-recipe open from the row itself.
    await firstPanel.locator('[data-action="log-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Log saved recipe");
    await page.locator(".dialog-close").click();
    await firstPanel.locator('[data-action="plan-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Add recipe to meal plan",
    );
});

test("S6 slice 4 regression: Archive recipe uses inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: archiving gated on
    // the native window.confirm() silently no-ops wherever that dialog
    // is dismissed or never answered. This test records AND dismisses
    // every native dialog: the archive flow must complete entirely
    // through in-dialog UI, so on the old code it fails twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/recipes");

    const salmonPanel = page.locator(
        '[data-recipe-name="sheet-pan salmon & broccoli"]',
    );
    await salmonPanel.locator('[data-action="view-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Atlantic salmon fillets",
    );

    const archive = page.locator('[data-action="archive-recipe"]');
    await archive.click();

    // Inline confirmation appears; nothing has been sent yet.
    const confirmArchive = page.locator(
        '[data-action="confirm-archive-recipe"]',
    );
    await expect(confirmArchive).toBeVisible();
    await expect(
        page.getByText(
            "Archive this recipe? Historical meal logs will be preserved.",
        ),
    ).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        false,
    );
    expect(nativeDialogs).toEqual([]);

    // "Keep recipe" restores the detail actions without any request.
    await page.locator('[data-action="dismiss-archive-recipe"]').click();
    await expect(archive).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        false,
    );

    // Confirming archives: the DELETE posts, the dialog closes, the
    // toast lands, and the library re-renders without the recipe.
    await archive.click();
    await confirmArchive.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Recipe archived.",
    );
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        true,
    );
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(page.locator(".recipe-panel")).toHaveCount(3);
    await expect(salmonPanel).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 3 regression: meal swap applies and undoes with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: swap apply and
    // swap undo gated on native window.confirm(). This test records
    // AND dismisses every native dialog — on the old code both flows
    // would silently no-op here; they must complete entirely through
    // the inline confirmation UI.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/plan");

    // The surface renders inside its Editorial Serif scope with the
    // week's summary merged into the heading line.
    await expect(page.locator(".operate-view.plan-view")).toHaveCount(1);
    await expect(page.locator("#app-content")).toContainText(
        "Fixture chicken bowls",
    );
    await expect(page.locator("#app-content")).toContainText(
        "1 planned across 1 of 7 days",
    );

    await page.locator('[data-action="meal-swap"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Fixture salmon");
    expect(
        observedRequest("GET", "/api/app/planning/fixture-planned-meal/swaps"),
    ).toBe(true);

    const apply = page.locator('[data-action="meal-swap-apply"]');
    await apply.click();
    const confirmApply = page.locator(
        '[data-action="meal-swap-apply-confirm"]',
    );
    await expect(confirmApply).toBeVisible();
    await expect(
        page.getByText("Apply this saved-recipe swap to the planned meal?"),
    ).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/planning/fixture-planned-meal/swap"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // Dismissing restores the candidate's Apply action, still unsent.
    await page.locator('[data-action="dismiss-plan-inline-confirm"]').click();
    await expect(apply).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/planning/fixture-planned-meal/swap"),
    ).toBe(false);

    await apply.click();
    await confirmApply.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Planned recipe swapped.",
    );
    expect(
        observedRequest("POST", "/api/app/planning/fixture-planned-meal/swap"),
    ).toBe(true);

    // Undo runs through the same inline pattern.
    const undo = page.locator('[data-action="meal-swap-undo"]');
    await expect(undo).toBeVisible();
    await undo.click();
    const confirmUndo = page.locator('[data-action="meal-swap-undo-confirm"]');
    await expect(confirmUndo).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/planning/swaps/fixture-swap-1/undo"),
    ).toBe(false);
    await confirmUndo.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Previous recipe restored.",
    );
    expect(
        observedRequest("POST", "/api/app/planning/swaps/fixture-swap-1/undo"),
    ).toBe(true);
    await expect(page.locator("#app-content")).toContainText(
        "Fixture chicken bowls",
    );
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 3 regression: plan draft cancel, commit and grocery handoff use no native confirm", async ({
    page,
}) => {
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/plan");

    // Create a saved-recipe draft through the guided planner.
    await page.locator('[data-action="guided-planner"]').click();
    await expect(page.locator("#guided-plan-form")).toBeVisible();
    await page
        .locator('.guided-plan-row [name="recipe_choice"]')
        .first()
        .selectOption("fixture-recipe-1|fixture-revision-1");
    await page.locator('#guided-plan-form button[type="submit"]').click();
    await expect(page.locator("#guided-plan-edit-form")).toBeVisible();
    expect(observedRequest("POST", "/api/app/planning/drafts")).toBe(true);

    // Cancel asks inline first; nothing is sent until confirmed.
    const cancel = page.locator('[data-action="guided-draft-cancel"]');
    await cancel.click();
    const confirmCancel = page.locator(
        '[data-action="guided-draft-cancel-confirm"]',
    );
    await expect(confirmCancel).toBeVisible();
    await expect(
        page.getByText("Cancel this plan draft? The calendar will not change."),
    ).toBeVisible();
    expect(
        observedRequest(
            "DELETE",
            "/api/app/planning/drafts/fixture-plan-draft",
        ),
    ).toBe(false);
    // "Keep draft" restores the review actions untouched.
    await page.locator('[data-action="guided-draft-confirm-dismiss"]').click();
    await expect(cancel).toBeVisible();
    await cancel.click();
    await confirmCancel.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Plan draft cancelled.",
    );
    expect(
        observedRequest(
            "DELETE",
            "/api/app/planning/drafts/fixture-plan-draft",
        ),
    ).toBe(true);
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");

    // A second draft runs the commit path, then the grocery handoff —
    // both inline-confirmed as well.
    await page.locator('[data-action="guided-planner"]').click();
    await page
        .locator('.guided-plan-row [name="recipe_choice"]')
        .first()
        .selectOption("fixture-recipe-1|fixture-revision-1");
    await page.locator('#guided-plan-form button[type="submit"]').click();
    await expect(page.locator("#guided-plan-edit-form")).toBeVisible();
    await page.locator('[data-action="guided-draft-commit"]').click();
    const confirmCommit = page.locator(
        '[data-action="guided-draft-commit-confirm"]',
    );
    await expect(confirmCommit).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/planning/drafts/fixture-plan-draft/commit",
        ),
    ).toBe(false);
    await confirmCommit.click();
    await expect(page.locator("#app-dialog")).toContainText("Plan committed");
    expect(
        observedRequest(
            "POST",
            "/api/app/planning/drafts/fixture-plan-draft/commit",
        ),
    ).toBe(true);

    await page.locator('[data-action="guided-groceries"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Fixture rice");
    expect(
        observedRequest(
            "GET",
            "/api/app/planning/drafts/fixture-plan-draft/groceries",
        ),
    ).toBe(true);
    await page.locator('[data-action="guided-grocery-commit"]').click();
    const confirmGroceries = page.locator(
        '[data-action="guided-grocery-commit-confirm"]',
    );
    await expect(confirmGroceries).toBeVisible();
    await expect(
        page.getByText("Add 1 selected item to the grocery list?"),
    ).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/planning/drafts/fixture-plan-draft/groceries/commit",
        ),
    ).toBe(false);
    await confirmGroceries.click();
    await expect(page.locator("#toast-region")).toContainText(
        "1 grocery item added.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/planning/drafts/fixture-plan-draft/groceries/commit",
        ),
    ).toBe(true);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 3 regression: guidance preferences save with no native confirm", async ({
    page,
}) => {
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/plan");
    await page.locator('[data-action="guidance-preferences"]').click();
    const form = page.locator("#guidance-preferences-form");
    await expect(form).toBeVisible();
    await form.locator('button[type="submit"]').click();
    const confirmSave = page.locator(
        '[data-action="guidance-preferences-confirm"]',
    );
    await expect(confirmSave).toBeVisible();
    await expect(
        page.getByText("Save these guidance preferences?"),
    ).toBeVisible();
    expect(observedRequest("PUT", "/api/app/guidance/preferences")).toBe(false);
    await confirmSave.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Guidance preferences saved (version 2).",
    );
    expect(observedRequest("PUT", "/api/app/guidance/preferences")).toBe(true);
    expect(nativeDialogs).toEqual([]);
});
test("S6 slice 6: Groceries groups by source, checks off at 44px, adds and edits, no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/groceries");

    // The fused surface: Editorial Serif scope, items grouped by
    // source (meal plan / recipe / manual), totals in the heading.
    await expect(page.locator(".operate-view.groceries-view")).toHaveCount(1);
    await expect(page.locator("#app-content")).toContainText(
        "4 items · 1 checked",
    );
    const rows = page.locator(".grocery-item-row");
    await expect(rows).toHaveCount(4);
    const groupHeads = page.locator(".grocery-group-head h4");
    await expect(groupHeads).toHaveCount(3);
    await expect(groupHeads.nth(0)).toContainText("From meal plan");
    await expect(groupHeads.nth(1)).toContainText("From recipe");
    await expect(groupHeads.nth(2)).toContainText("Added manually");

    // The checkbox is the tap target: exactly 44x44, as in the
    // tightened mock. The purchased fixture item starts checked.
    const spinachCheck = page.locator(
        '[data-grocery-item-id="fixture-grocery-spinach"] .grocery-check-input',
    );
    const checkBox = await spinachCheck.boundingBox();
    expect(checkBox).not.toBeNull();
    expect(Math.round(checkBox!.width)).toBe(44);
    expect(Math.round(checkBox!.height)).toBe(44);
    await expect(
        page.locator(
            '[data-grocery-item-id="fixture-grocery-eggs"] .grocery-check-input',
        ),
    ).toBeChecked();

    // No ad slot on Groceries — not with the flag off, and not with
    // it on either (the app's only slot is on Today).
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/groceries");
    await expect(rows).toHaveCount(4);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);

    // Check-off posts the purchased state and toasts.
    await spinachCheck.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Marked purchased.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/groceries/items/fixture-grocery-spinach/purchased",
        ),
    ).toBe(true);

    // Manual add rides the themed dialog.
    await page
        .locator('.grocery-list-actions [data-action="add-grocery"]')
        .click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Add personal grocery",
    );
    await page
        .locator('#grocery-add-form [name="name"]')
        .fill("Cottage cheese");
    await page.locator('#grocery-add-form button[type="submit"]').click();
    await expect(page.locator("#toast-region")).toContainText(
        "Grocery item added.",
    );
    expect(observedRequest("POST", "/api/app/groceries/items")).toBe(true);

    // Quantity/unit editing rides the edit dialog.
    const riceRow = page.locator(
        '[data-grocery-item-id="fixture-grocery-rice"]',
    );
    await riceRow.locator('[data-action="edit-grocery"]').click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Edit grocery item",
    );
    await expect(page.locator('#grocery-edit-form [name="name"]')).toHaveValue(
        "Jasmine rice",
    );
    await page.locator('#grocery-edit-form [name="quantity"]').fill("5");
    await page.locator('#grocery-edit-form button[type="submit"]').click();
    await expect(page.locator("#toast-region")).toContainText(
        "Grocery item updated.",
    );
    expect(
        observedRequest(
            "PATCH",
            "/api/app/groceries/items/fixture-grocery-rice",
        ),
    ).toBe(true);
});

test("S6 slice 6 regression: remove and clear-purchased use inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: both destructive
    // Groceries flows gated on the native window.confirm(), which
    // silently no-ops wherever that dialog is dismissed or never
    // answered. This test records AND dismisses every native dialog:
    // both flows must complete entirely through in-page UI, so on the
    // old code they fail twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/groceries");

    // Remove: the first click only asks, in place under the row.
    const milkRow = page.locator(
        '[data-grocery-item-id="fixture-grocery-milk"]',
    );
    const remove = milkRow.locator('[data-action="remove-grocery"]');
    await remove.click();
    const confirmRemove = page.locator(
        '[data-action="confirm-remove-grocery"]',
    );
    await expect(confirmRemove).toBeVisible();
    await expect(
        page.getByText("Remove Oat milk from the list?"),
    ).toBeVisible();
    expect(
        observedRequest(
            "DELETE",
            "/api/app/groceries/items/fixture-grocery-milk",
        ),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep item" restores the row's Remove action, still unsent.
    await page.locator('[data-action="dismiss-grocery-confirm"]').click();
    await expect(remove).toBeVisible();
    expect(
        observedRequest(
            "DELETE",
            "/api/app/groceries/items/fixture-grocery-milk",
        ),
    ).toBe(false);

    // Confirming removes: DELETE posts, toast lands, row is gone.
    await remove.click();
    await confirmRemove.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Grocery item removed.",
    );
    expect(
        observedRequest(
            "DELETE",
            "/api/app/groceries/items/fixture-grocery-milk",
        ),
    ).toBe(true);
    await expect(page.locator(".grocery-item-row")).toHaveCount(3);
    await expect(milkRow).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);

    // Clear purchased: same inline pattern under the list title.
    const clear = page.locator('[data-action="clear-purchased"]');
    await clear.click();
    const confirmClear = page.locator(
        '[data-action="confirm-clear-purchased"]',
    );
    await expect(confirmClear).toBeVisible();
    await expect(
        page.getByText("Remove all 1 purchased item from this list?"),
    ).toBeVisible();
    expect(observedRequest("POST", "/api/app/groceries/clear-purchased")).toBe(
        false,
    );
    await page.locator('[data-action="dismiss-grocery-confirm"]').click();
    await expect(clear).toBeVisible();
    expect(observedRequest("POST", "/api/app/groceries/clear-purchased")).toBe(
        false,
    );
    await clear.click();
    await confirmClear.click();
    await expect(page.locator("#toast-region")).toContainText(
        "1 purchased item cleared.",
    );
    expect(observedRequest("POST", "/api/app/groceries/clear-purchased")).toBe(
        true,
    );
    await expect(
        page.locator('[data-grocery-item-id="fixture-grocery-eggs"]'),
    ).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 5: Cooks list renders themed panels with row actions and no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/cooks");

    // The fused list: one themed panel per fixture cook (the tightened
    // mock's four cooks), the active cook leading, each panel carrying
    // Open + Finish/Reopen + the Compare toggle on its action row.
    const panels = page.locator(".cook-panel");
    await expect(panels).toHaveCount(4);
    const activePanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chicken-rice"]',
    );
    await expect(activePanel).toContainText("Weeknight Chicken & Rice");
    await expect(activePanel).toContainText("Active");
    await expect(
        activePanel.locator('[data-action="open-cook"]'),
    ).toBeVisible();
    await expect(
        activePanel.locator('[data-action="finish-cook"]'),
    ).toBeVisible();
    await expect(activePanel.locator("[data-cook-select]")).toBeVisible();
    const chiliPanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chili"]',
    );
    await expect(chiliPanel).toContainText("based on an earlier attempt");
    await expect(
        chiliPanel.locator('[data-action="reopen-cook"]'),
    ).toBeVisible();

    // No ad slot on Cooks — not with the flag off, and not with it on
    // either (the app's only slot is on Today). The native banner is
    // never asked to show here.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/cooks");
    await expect(panels).toHaveCount(4);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);

    // The active cook opens into the themed detail: dishes, timeline,
    // and the NL update form all render inside the shared frame.
    await activePanel.locator('[data-action="open-cook"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Chicken & Rice");
    await expect(page.locator("#app-dialog")).toContainText(
        "Chicken went into the hot skillet.",
    );
    await expect(page.locator("#cook-update-form")).toBeVisible();
});

test("S6 slice 5 regression: Finish and Delete cooks use inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: the native
    // window.confirm() silently no-ops wherever that dialog is
    // dismissed or never answered. Delete gated on it; Finish now
    // follows the same inline pattern. This test records AND dismisses
    // every native dialog: both flows must complete entirely through
    // in-page UI, so on the old code they fail twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/cooks");

    // Finish, from the list card: first click only asks, in place.
    const activePanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chicken-rice"]',
    );
    const finish = activePanel.locator('[data-action="finish-cook"]');
    await finish.click();
    const confirmFinish = activePanel.locator(
        '[data-action="confirm-finish-cook"]',
    );
    await expect(confirmFinish).toBeVisible();
    await expect(
        page.getByText("Finish this cook? You can reopen it later."),
    ).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep cooking" restores the card actions without any request.
    await activePanel.locator('[data-action="dismiss-cook-confirm"]').click();
    await expect(finish).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(false);

    // Confirming finishes: the POST lands, the toast shows, and the
    // card re-renders as a finished cook.
    await finish.click();
    await confirmFinish.click();
    await expect(page.locator("#toast-region")).toContainText("Cook finished.");
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(true);
    await expect(
        activePanel.locator('[data-action="reopen-cook"]'),
    ).toBeVisible();

    // Delete, from the cook detail: first click only asks, in place.
    await activePanel.locator('[data-action="open-cook"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Timeline");
    const deleteButton = page.locator('[data-action="delete-cook"]');
    await deleteButton.click();
    const confirmDelete = page.locator('[data-action="confirm-delete-cook"]');
    await expect(confirmDelete).toBeVisible();
    await expect(
        page.getByText(
            "Delete this cook, its timeline, results, and saved photos? This cannot be undone.",
        ),
    ).toBeVisible();
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep cook" restores the detail actions without any request.
    await page.locator('[data-action="dismiss-cook-confirm"]').click();
    await expect(deleteButton).toBeVisible();
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(false);

    // Confirming deletes: the DELETE lands, the dialog closes, the
    // toast shows, and the list re-renders without the cook.
    await deleteButton.click();
    await confirmDelete.click();
    await expect(page.locator("#toast-region")).toContainText("Cook deleted.");
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(true);
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(page.locator(".cook-panel")).toHaveCount(3);
    await expect(activePanel).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

function observedSearch(method: string, path: string): URLSearchParams {
    const entry = [...observed]
        .reverse()
        .find((item) => item.method === method && item.path === path);
    if (!entry) throw new Error(`No observed ${method} ${path}`);
    return new URLSearchParams(entry.search);
}

function daySpan(params: URLSearchParams): number {
    const start = new Date(`${params.get("start")}T12:00:00Z`).getTime();
    const end = new Date(`${params.get("end")}T12:00:00Z`).getTime();
    return Math.round((end - start) / 86_400_000);
}

test("Trends: dashboard renders, check-in stays windowed, catalog builds a persistent custom dashboard, drill ends at the day, no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    // T8: the retired Insights route lands on Trends.
    await gotoRoute(page, "/app/insights");
    await expect(page.locator(".operate-view.trends-view")).toHaveCount(1);
    expect(page.url()).toContain("/app/trends");

    // The default dashboard (T2): calories first with its verdict and
    // its labeled target band (T6/T13), one labeled bar per day.
    const caloriesCard = page.locator(
        '.trends-card[data-card-key="bar:calories"]',
    );
    await expect(caloriesCard).toBeVisible();
    await expect(caloriesCard).toContainText("in range 1 of 6 days");
    await expect(caloriesCard.locator("[data-chart-label]")).toContainText(
        "target 2,090–2,310",
    );
    await expect(caloriesCard.locator("[data-bar-date]")).toHaveCount(6);
    await expect(
        page.locator('.trends-card[data-card-key="line:weight"]'),
    ).toContainText("about −0.4 lb a week");
    await expect(
        page.locator('.trends-card[data-card-key="digest"]'),
    ).toContainText("The week in words");
    await expect(
        page.locator('.trends-card[data-card-key="digest"]'),
    ).toContainText("86% coverage");
    await expect(page.getByTestId("chat-entry-insights")).toContainText(
        "Explain my week",
    );
    await expect(page.locator("#app-content")).toContainText(
        "Recorded calories averaged 1,940 kcal",
    );
    await expect(page.locator("#app-content")).toContainText(
        "Lunch is your most consistently logged meal",
    );

    // T14 spot-check in the real bundle render: the reference label's
    // box never intersects a bar's box.
    const overlap = await page.evaluate(() => {
        const card = document.querySelector(
            '.trends-card[data-card-key="bar:calories"]',
        );
        const label = card?.querySelector("[data-chart-label]");
        if (!label) return "no label";
        const lb = label.getBoundingClientRect();
        for (const bar of card.querySelectorAll("[data-bar-date]")) {
            const bb = bar.getBoundingClientRect();
            if (
                lb.left < bb.right &&
                bb.left < lb.right &&
                lb.top < bb.bottom &&
                bb.top < lb.bottom
            ) {
                return `label overlaps bar ${bar.getAttribute("data-bar-date")}`;
            }
        }
        return null;
    });
    expect(overlap).toBeNull();

    // The known-bug guard (PR #184): the default 30-day view windows
    // its Digest check-in request to the last 7 days.
    const trendsParams = observedSearch("GET", "/api/app/trends");
    const checkinParams = observedSearch("GET", "/api/app/insights/checkin");
    expect(daySpan(trendsParams)).toBe(29);
    expect(daySpan(checkinParams)).toBe(6);
    expect(checkinParams.get("end")).toBe(trendsParams.get("end"));

    // Range switch re-renders at 7 days and both requests agree.
    await page.locator('[data-action="trends-range"][data-days="7"]').click();
    await expect(page.locator("#app-content")).toContainText("Last 7 days");
    expect(daySpan(observedSearch("GET", "/api/app/trends"))).toBe(6);
    expect(daySpan(observedSearch("GET", "/api/app/insights/checkin"))).toBe(6);
    await page.locator('[data-action="trends-range"][data-days="30"]').click();
    await expect(page.locator("#app-content")).toContainText("Last 30 days");

    // T11 drill: a bar opens its day sheet with ranked contributors,
    // and the sheet's one destination is that day's log.
    await page
        .locator(
            '.trends-card[data-card-key="bar:calories"] [data-action="trends-drill-day"][data-date="2026-11-05"]',
        )
        .click();
    const dialog = page.locator("#app-dialog");
    await expect(dialog).toContainText("Grilled chicken breast");
    await expect(dialog).toContainText("2,140");
    await dialog.getByRole("button", { name: "Open that day's log" }).click();
    await expect(page.locator(".operate-view.today-view")).toHaveCount(1);

    // T3/T4: edit mode + the two-step catalog build a custom
    // dashboard — remove Protein, compact Calories, add a Fiber bar
    // (the bar step never offers Weight: the T5 guardrail) and a
    // Macro split donut, whose segment drills to top foods.
    await gotoRoute(page, "/app/trends");
    await page.locator('[data-action="trends-edit-toggle"]').click();
    const proteinCard = page.locator(
        '.trends-card[data-card-key="bar:protein_g"]',
    );
    await proteinCard.locator('[data-action="trends-remove"]').click();
    await expect(proteinCard).toHaveCount(0);
    await caloriesCard.locator('[data-action="trends-size"]').click();
    await expect(caloriesCard).toHaveClass(/is-compact/);
    await page.locator('[data-action="trends-edit-toggle"]').click();

    await page.locator('[data-action="trends-add"]').click();
    await expect(dialog).toContainText("what kind of chart?");
    await dialog
        .locator('[data-action="trends-catalog-shape"][data-shape="bar"]')
        .click();
    await expect(dialog).toContainText("showing what?");
    await expect(dialog.locator('[data-data="weight"]')).toHaveCount(0);
    await dialog
        .locator('[data-action="trends-catalog-add"][data-data="fiber_g"]')
        .click();
    const fiberCard = page.locator('.trends-card[data-card-key="bar:fiber_g"]');
    await expect(fiberCard).toBeVisible();
    await expect(fiberCard).toContainText("From 4 of 7 days");

    await page.locator('[data-action="trends-add"]').click();
    await dialog
        .locator('[data-action="trends-catalog-shape"][data-shape="breakdown"]')
        .click();
    await dialog
        .locator('[data-action="trends-catalog-add"][data-data="macro_split"]')
        .click();
    const donutCard = page.locator(
        '.trends-card[data-card-key="breakdown:macro_split"]',
    );
    await expect(donutCard).toBeVisible();
    await donutCard
        .locator(
            '[data-action="trends-drill-segment"][data-metric="protein_g"]',
        )
        .click({ position: { x: 46, y: 10 } });
    await expect(dialog).toContainText("Grilled Chicken Breast");
    await dialog.locator('[data-action="close-dialog"]').click();

    // T9: the layout is the account's, server-side — a full reboot
    // renders the same custom dashboard.
    expect(observedRequest("PUT", "/api/app/trends/layout")).toBe(true);
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/trends");
    await expect(
        page.locator('.trends-card[data-card-key="bar:protein_g"]'),
    ).toHaveCount(0);
    await expect(
        page.locator('.trends-card[data-card-key="bar:fiber_g"]'),
    ).toBeVisible();
    await expect(
        page.locator('.trends-card[data-card-key="breakdown:macro_split"]'),
    ).toBeVisible();
    await expect(
        page.locator('.trends-card[data-card-key="bar:calories"]'),
    ).toHaveClass(/is-compact/);

    await page.screenshot({
        path: "test-results/trends-mobile-custom-dashboard.png",
        fullPage: true,
    });

    // No ad slot on Trends — not with the flag off, and not with
    // it on either (the app's only slot is on Today).
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/trends");
    await expect(page.locator(".trends-view")).toHaveCount(1);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);
});

test("Vitals regression (on Today since the Trends retirement): water and weight deletes use inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: both vitals Delete
    // actions gated on the native window.confirm(), which silently
    // no-ops wherever that dialog is dismissed or never answered.
    // This test records AND dismisses every native dialog: both flows
    // must complete entirely through in-page UI.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    vitalsOnToday = true;
    await bootPackagedApp(page);
    await gotoRoute(page, "/app");

    // Water: the first click only asks, in place inside the row.
    const waterRow = page.locator(".today-view .food-row", {
        hasText: "500 ml",
    });
    await expect(waterRow).toBeVisible();
    const waterDelete = waterRow.locator('[data-action="delete-water"]');
    await waterDelete.click();
    const confirmWater = page.locator('[data-action="confirm-delete-water"]');
    await expect(confirmWater).toBeVisible();
    await expect(
        page.getByText("Permanently delete this water entry?"),
    ).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/water/fixture-water-1")).toBe(
        false,
    );
    expect(nativeDialogs).toEqual([]);

    // "Keep entry" restores the row's actions, still unsent.
    await page.locator('[data-action="dismiss-delete-vital"]').click();
    await expect(waterDelete).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/water/fixture-water-1")).toBe(
        false,
    );

    // Confirming deletes: DELETE posts, toast lands, row is gone.
    await waterDelete.click();
    await confirmWater.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Water entry deleted.",
    );
    expect(observedRequest("DELETE", "/api/app/water/fixture-water-1")).toBe(
        true,
    );
    await expect(
        page.locator(".today-view .food-row", { hasText: "500 ml" }),
    ).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);

    // Weight: the same inline pattern inside the weight history rows.
    const weightRow = page.locator(".today-view .food-row", {
        hasText: "182.4 lb",
    });
    const weightDelete = weightRow.locator('[data-action="delete-weight"]');
    await weightDelete.click();
    const confirmWeight = page.locator('[data-action="confirm-delete-weight"]');
    await expect(confirmWeight).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/weight/fixture-weight-1")).toBe(
        false,
    );
    await page.locator('[data-action="dismiss-delete-vital"]').click();
    await expect(weightDelete).toBeVisible();
    await weightDelete.click();
    await confirmWeight.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Weight entry deleted.",
    );
    expect(observedRequest("DELETE", "/api/app/weight/fixture-weight-1")).toBe(
        true,
    );
    await expect(
        page.locator(".today-view .food-row", { hasText: "182.4 lb" }),
    ).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S8 chat: Premium round-trip — send, grounded draft proposal, draft review opens, nothing logged by the chat", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/chat");

    // Empty state: the thinking-partner panel + a real composer.
    await expect(page.getByTestId("chat-empty")).toBeVisible();
    await expect(page.locator("#chat-input")).toBeVisible();
    expect(observedRequest("GET", "/api/app/chat")).toBe(true);

    await page
        .locator("#chat-input")
        .fill("Log 150 g grilled chicken and a moon soup for lunch");
    await page.getByRole("button", { name: "Send" }).click();

    // The reply renders with the user turn above it and the draft
    // proposal card carrying the per-item grounding trace.
    await expect(page.locator(".chat-thread")).toContainText(
        "Set up as a draft",
    );
    // Chat v2: the reply shows the MCP tools the agent used (the
    // persisted tool trace), so the work is visible on the surface.
    await expect(page.locator(".chat-tool-trace")).toContainText(
        "search_foods",
    );
    await expect(page.locator(".chat-tool-trace")).toContainText(
        "prepare_meal_review",
    );
    await expect(page.locator(".chat-message-user")).toContainText("moon soup");
    const card = page.locator(".chat-draft-card");
    await expect(card).toContainText("Grilled chicken breast");
    await expect(card).toContainText("Grounded · USDA");
    await expect(card).toContainText("Mystery moon soup");
    await expect(card).toContainText("No verified nutrition yet");
    await expect(card).toContainText("Nothing is logged yet");
    expect(observedRequest("POST", "/api/app/chat/messages")).toBe(true);
    // Confirm-before-save: the chat itself never confirms a draft.
    expect(
        observed.some(
            (entry) =>
                entry.method === "POST" && entry.path.endsWith("/confirm"),
        ),
    ).toBe(false);

    // The proposal opens the EXISTING meal-draft review — the shared
    // confirm path is where logging can happen, by the user's hand.
    await card.getByRole("button", { name: "Review draft" }).click();
    await expect(page.locator("#meal-draft-review")).toContainText(
        "Chicken breast, grilled",
    );
    await expect(page.locator("#meal-draft-review")).toContainText(
        "Source: chat",
    );
    expect(
        observedRequest("GET", "/api/app/meal-drafts/fixture-chat-draft"),
    ).toBe(true);
});

test("S8 chat: Free gate state — honest Premium explanation, no fake chat box, no send attempted", async ({
    page,
}) => {
    chatVariant = "free";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/chat");

    const gate = page.getByTestId("chat-gate");
    await expect(gate).toBeVisible();
    await expect(gate).toContainText("part of Munch Premium");
    await expect(gate).toContainText("Ad-free in the app");
    await expect(gate).toContainText("MCP access");
    await expect(gate).toContainText("Every other Munch feature");
    // The subscribe door is the website/rail billing surface — and
    // there is NO composer that would error on send.
    await expect(
        gate.getByRole("link", { name: "View plan & billing" }),
    ).toHaveAttribute("href", "/app/settings/billing");
    await expect(page.locator("#chat-input")).toHaveCount(0);
    await expect(page.locator("#chat-form")).toHaveCount(0);
    expect(observedRequest("POST", "/api/app/chat/messages")).toBe(false);
});

test("chat v2 placement: contextual entries only — no global entry, seeded openings", async ({
    page,
}) => {
    await bootPackagedApp(page);

    // No global chat entry anywhere: no sidebar/mobile nav item with
    // the chat route, and no More-row card.
    await expect(page.locator('[data-route="chat"]')).toHaveCount(0);
    await gotoRoute(page, "/app/more");
    await expect(page.locator(".more-card", { hasText: "Chat" })).toHaveCount(
        0,
    );

    // Today: the entry sits inside the guidance panel, labelled for
    // its surface, under the guidance it attaches to.
    await gotoRoute(page, "/app");
    const todayEntry = page.getByTestId("chat-entry-today");
    await expect(todayEntry).toBeVisible();
    await expect(todayEntry).toContainText("Ask about today");
    await expect(todayEntry).toContainText(
        "Opens with today's log and goals attached",
    );

    // Meal Plan and Trends carry their own entries.
    await gotoRoute(page, "/app/plan");
    await expect(page.getByTestId("chat-entry-meal_plan")).toContainText(
        "Adjust or explain this plan",
    );
    await gotoRoute(page, "/app/trends");
    await expect(page.getByTestId("chat-entry-insights")).toContainText(
        "Explain my week",
    );

    // Entering from Today opens the seeded conversation: context
    // strip, the opener written from that context, its starters.
    await gotoRoute(page, "/app");
    await page.getByTestId("chat-entry-today").click();
    await expect(page).toHaveURL(/\/app\/chat\?surface=today/);
    await expect(page.getByTestId("chat-seed")).toBeVisible();
    await expect(page.getByTestId("chat-seed")).toContainText(
        "Today so far: 0 kcal across 0 meals",
    );
    await expect(page.locator(".chat-thread")).toContainText(
        "Nothing is logged yet today",
    );
    await expect(page.locator(".chat-starters-seeded")).toContainText(
        "How is today looking against my goals?",
    );
    await expect(page.locator(".page-heading")).toContainText(
        "started from Today",
    );
    expect(observedRequest("POST", "/api/app/chat/conversations")).toBe(true);

    // Pantry is the second packaged page: its entry is present with
    // the seeded href (presence + target asserted; a click would
    // leave the SPA shell by design of the two-page bundle).
    await page.goto(`${baseURL}/pantry.html`);
    const pantryEntry = page.getByTestId("chat-entry-pantry");
    await expect(pantryEntry).toBeVisible();
    await expect(pantryEntry).toContainText("Cook from what's here");
    await expect(pantryEntry).toHaveAttribute(
        "href",
        "/app/chat?surface=pantry",
    );
});
