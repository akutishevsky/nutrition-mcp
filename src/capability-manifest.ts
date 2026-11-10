/**
 * Cross-surface outcome contracts.
 *
 * This is intentionally an outcome manifest, not a mirror of the MCP tool
 * catalog. Several tools can support one customer workflow, and some website
 * capabilities are intentionally website-only (billing, account controls,
 * and household administration). A capability that is not yet complete is
 * still represented here with an owner and target PR so the gap is explicit.
 *
 * Channel access note (Amendment D, 2026-11-09): the `mcp` channel itself
 * is a Premium entitlement — the OAuth consent page refuses approval for a
 * Free account and every MCP request re-checks the current entitlement
 * (src/mcp-entitlement.ts). The web and app channels are free and fully
 * featured for every account. The per-capability `mcp` rows below describe
 * what a Premium MCP connection can do; they are not a promise that the
 * MCP channel is free.
 */

export type CapabilityCoverage = "complete" | "partial" | "missing";

export interface CapabilityChannel {
    available: boolean;
    coverage: CapabilityCoverage;
    entryPoints: readonly string[];
}

export interface CapabilityContract {
    id: string;
    mcp: CapabilityChannel;
    web: CapabilityChannel;
    /**
     * The packaged Android app channel (S0, Full Parity App Program).
     * The app is a packaged copy of the portal, so a complete app channel
     * reuses the web entry points — but it must be declared explicitly:
     * before S0, "web" was silently assumed to mean "app", which hid the
     * Android AI gates and the website-only surfaces. A row may
     * only omit app entry points via `intentionalChannelException`
     * (website-only by design) or a documented `gap` + `targetPr`.
     */
    app: CapabilityChannel;
    /**
     * The packaged iOS app channel (IOS-PLATFORM, Amendment H — pure
     * parity). iOS packages the SAME .mobile-web bundle as Android
     * (`cap sync ios` from the same build script), so most verdicts
     * follow the Android channel — but each row's verdict was derived
     * individually, not copied: `iosBasis` states the basis for every
     * row (shared bundle / cross-platform plugin / named native or
     * config gap), and a row whose iOS outcome genuinely differs
     * (missing native counterpart, auth/billing/ads rail, download
     * handoff) carries a partial/missing verdict plus `iosGap` +
     * `iosTargetPr` instead of borrowing Android's completeness.
     * Cross-cutting native gaps that no single row owns are recorded
     * in IOS_CHANNEL_NATIVE_GAPS below.
     */
    ios: CapabilityChannel;
    iosBasis: string;
    iosGap: string | null;
    iosTargetPr: string | null;
    intentionalChannelException: string | null;
    gap: string | null;
    targetPr: string | null;
}

const complete = (entryPoints: readonly string[]): CapabilityChannel => ({
    available: true,
    coverage: "complete",
    entryPoints,
});

const partial = (entryPoints: readonly string[]): CapabilityChannel => ({
    available: true,
    coverage: "partial",
    entryPoints,
});

const missing = (): CapabilityChannel => ({
    available: false,
    coverage: "missing",
    entryPoints: [],
});

const websiteOnly = (
    entryPoints: readonly string[],
): CapabilityContract["mcp"] => ({
    available: false,
    coverage: "missing",
    entryPoints,
});

export const CAPABILITY_MANIFEST = [
    {
        id: "meal.create",
        mcp: complete(["log_meal"]),
        web: complete([
            "POST /api/app/meals",
            "GET /api/app/food-search",
            "GET /api/app/food-details",
        ]),
        app: complete([
            "POST /api/app/meals",
            "GET /api/app/food-search",
            "GET /api/app/food-details",
        ]),
        ios: complete([
            "POST /api/app/meals",
            "GET /api/app/food-search",
            "GET /api/app/food-details",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.read",
        mcp: complete([
            "get_meals_today",
            "get_meals_by_date",
            "get_meals_by_date_range",
        ]),
        web: complete(["/api/app/today", "/api/app/meals"]),
        app: complete(["/api/app/today", "/api/app/meals"]),
        ios: complete(["/api/app/today", "/api/app/meals"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.update",
        mcp: complete(["update_meal"]),
        web: complete([
            "/api/app/meals/:id",
            "/api/app/meals/:mealId/items/:itemId",
            "/api/app/meals/:mealId/items",
            "DELETE /api/app/meals/:mealId/items/:itemId",
            '[data-action="edit-meal"]',
            "[data-patch-food-search-form]",
            "[data-patch-food-option]",
        ]),
        app: complete([
            "/api/app/meals/:id",
            "/api/app/meals/:mealId/items/:itemId",
            "/api/app/meals/:mealId/items",
            "DELETE /api/app/meals/:mealId/items/:itemId",
            '[data-action="edit-meal"]',
            "[data-patch-food-search-form]",
            "[data-patch-food-option]",
        ]),
        ios: complete([
            "/api/app/meals/:id",
            "/api/app/meals/:mealId/items/:itemId",
            "/api/app/meals/:mealId/items",
            "DELETE /api/app/meals/:mealId/items/:itemId",
            '[data-action="edit-meal"]',
            "[data-patch-food-search-form]",
            "[data-patch-food-option]",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.delete",
        mcp: complete(["delete_meal"]),
        web: complete(["DELETE /api/app/meals/:id"]),
        app: complete(["DELETE /api/app/meals/:id"]),
        ios: complete(["DELETE /api/app/meals/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.copy",
        mcp: websiteOnly([]),
        web: complete(["POST /api/app/meals/:id/copy"]),
        app: complete(["POST /api/app/meals/:id/copy"]),
        ios: complete(["POST /api/app/meals/:id/copy"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException:
            "The website keeps structured duplication as a direct diary convenience; MCP can re-log through its normal meal tools.",
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.search",
        mcp: complete(["search_meals"]),
        web: complete(["GET /api/app/meals?q=…", "#meal-history-search"]),
        app: complete(["GET /api/app/meals?q=…", "#meal-history-search"]),
        ios: complete(["GET /api/app/meals?q=…", "#meal-history-search"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.details",
        mcp: complete(["get_meal_details"]),
        web: complete([
            "GET /api/app/meals/:id",
            '[data-action="view-meal-details"]',
        ]),
        app: complete([
            "GET /api/app/meals/:id",
            '[data-action="view-meal-details"]',
        ]),
        ios: complete([
            "GET /api/app/meals/:id",
            '[data-action="view-meal-details"]',
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.provenance",
        mcp: complete(["get_nutrition_provenance"]),
        web: complete(["GET /api/app/insights (provenance)", "/app/insights"]),
        app: complete(["GET /api/app/insights (provenance)", "/app/insights"]),
        ios: complete(["GET /api/app/insights (provenance)", "/app/insights"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.weeklyCheckin",
        mcp: complete(["get_weekly_checkin"]),
        web: complete(["GET /api/app/insights/checkin"]),
        app: complete(["GET /api/app/insights/checkin"]),
        ios: complete(["GET /api/app/insights/checkin"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.dailyGuidance",
        mcp: complete(["get_daily_guidance"]),
        web: complete(["GET /api/app/guidance/today"]),
        app: complete(["GET /api/app/guidance/today"]),
        ios: complete(["GET /api/app/guidance/today"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "meal.import",
        mcp: complete(["bulk_import_meals", "start_meal_import"]),
        web: complete([
            "POST /api/app/import/parse",
            "POST /api/app/import",
            "/app/settings/data",
        ]),
        app: complete([
            "POST /api/app/import/parse",
            "POST /api/app/import",
            "/app/settings/data",
        ]),
        ios: complete([
            "POST /api/app/import/parse",
            "POST /api/app/import",
            "/app/settings/data",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        // S3 photo-logging decider (brief §3): the server sees the meal
        // photo, identifies items + portions with Ember vision, grounds
        // deterministically, and lands a confirmable draft. The MCP
        // achieves the same OUTCOME through the client-model draft path
        // (the client's model is the decider; the draft tools are
        // contract-owned by the mealDraft.* rows, and the manifest's
        // one-tool-one-row invariant forbids listing them twice), so —
        // following the meal.copy precedent — the mcp channel is encoded
        // websiteOnly-style with the path named here. The server pipeline
        // itself is web/app-only and is fenced off the MCP runtime by
        // host-ai-boundary.test.ts.
        id: "meal.photoLog",
        mcp: websiteOnly([]),
        web: complete([
            "POST /api/app/meal-photo",
            '[data-action="log-by-photo"]',
            "POST /api/app/meal-drafts/:id/add-text",
            '[data-action="add-draft-text"]',
            "POST /api/app/meal-drafts/:id/confirm",
        ]),
        // S5: app channel verified complete — the packaged bundle runs
        // the full flow (native capture → POST meal-photo → draft
        // review → add-text → confirm) in e2e/mobile-parity.e2e.ts.
        app: complete([
            "POST /api/app/meal-photo",
            '[data-action="log-by-photo"]',
            "POST /api/app/meal-drafts/:id/add-text",
            '[data-action="add-draft-text"]',
            "POST /api/app/meal-drafts/:id/confirm",
        ]),
        ios: partial([
            "POST /api/app/meal-photo",
            '[data-action="log-by-photo"]',
            "POST /api/app/meal-drafts/:id/add-text",
            '[data-action="add-draft-text"]',
            "POST /api/app/meal-drafts/:id/confirm",
        ]),
        iosBasis:
            "Shared bundle + cross-platform @capacitor/camera: the iOS SPM package is present and the camera/photo usage strings land in the iOS Info.plist in this slice, so Take photo / Choose photo hand the image to the same dialog as Android. The process-death restore leg differs — see iosGap.",
        iosGap: "Capture restoration after process death has no iOS counterpart today: the shared runtime restores pending captures from Capacitor's appRestoredResult event, which Capacitor emits on Android only, and iOS has no native plugin of its own yet. A capture interrupted by iOS process death is lost instead of being restored into the dialog.",
        iosTargetPr:
            "IOS-PLATFORM follow-up — iOS capture-restore (native plugin or picker-lifecycle equivalent)",
        intentionalChannelException:
            "MCP photo logging is complete via the client-model draft path (start_meal_draft → upsert_meal_draft_item with model_estimate items → confirm_meal_draft, owned by the mealDraft.* contracts); the S3 server decider pipeline is a web/app surface.",
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.create",
        mcp: complete(["start_meal_draft", "prepare_meal_review"]),
        web: complete([
            "POST /api/app/meal-drafts",
            '[data-action="start-meal-draft"]',
        ]),
        app: complete([
            "POST /api/app/meal-drafts",
            '[data-action="start-meal-draft"]',
        ]),
        ios: complete([
            "POST /api/app/meal-drafts",
            '[data-action="start-meal-draft"]',
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.read",
        mcp: complete(["get_meal_draft"]),
        web: complete(["/api/app/today", "GET /api/app/meal-drafts/:id"]),
        app: complete(["/api/app/today", "GET /api/app/meal-drafts/:id"]),
        ios: complete(["/api/app/today", "GET /api/app/meal-drafts/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.review",
        mcp: complete(["prepare_meal_confirmation"]),
        // S5 correction: the standalone POST /meal-drafts/:id/prepare
        // route exists server-side but no client calls it — on web/app
        // the prepare step runs server-side inside POST …/confirm, and
        // the review surface itself is the draft read below.
        web: complete(["GET /api/app/meal-drafts/:id"]),
        app: complete(["GET /api/app/meal-drafts/:id"]),
        ios: complete(["GET /api/app/meal-drafts/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.update",
        mcp: complete([
            "update_meal_draft",
            "upsert_meal_draft_item",
            "add_meal_draft_question",
            "answer_meal_draft_question",
        ]),
        web: complete([
            "PATCH /api/app/meal-drafts/:id",
            "POST /api/app/meal-drafts/:id/items",
            "PATCH /api/app/meal-drafts/:draftId/items/:itemId",
            "DELETE /api/app/meal-drafts/:draftId/items/:itemId",
            "POST /api/app/meal-drafts/:draftId/questions/:questionId/answer",
        ]),
        app: complete([
            "PATCH /api/app/meal-drafts/:id",
            "POST /api/app/meal-drafts/:id/items",
            "PATCH /api/app/meal-drafts/:draftId/items/:itemId",
            "DELETE /api/app/meal-drafts/:draftId/items/:itemId",
            "POST /api/app/meal-drafts/:draftId/questions/:questionId/answer",
        ]),
        ios: complete([
            "PATCH /api/app/meal-drafts/:id",
            "POST /api/app/meal-drafts/:id/items",
            "PATCH /api/app/meal-drafts/:draftId/items/:itemId",
            "DELETE /api/app/meal-drafts/:draftId/items/:itemId",
            "POST /api/app/meal-drafts/:draftId/questions/:questionId/answer",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.confirm",
        mcp: complete(["confirm_meal_draft", "resolve_meal_review"]),
        web: complete(["POST /api/app/meal-drafts/:id/confirm"]),
        app: complete(["POST /api/app/meal-drafts/:id/confirm"]),
        ios: complete(["POST /api/app/meal-drafts/:id/confirm"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealDraft.cancel",
        mcp: complete(["cancel_meal_draft"]),
        web: complete(["POST /api/app/meal-drafts/:id/cancel"]),
        app: complete(["POST /api/app/meal-drafts/:id/cancel"]),
        ios: complete(["POST /api/app/meal-drafts/:id/cancel"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.search",
        mcp: complete(["search_foods"]),
        web: complete(["GET /api/app/food-search"]),
        app: complete(["GET /api/app/food-search"]),
        ios: complete(["GET /api/app/food-search"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.inspect",
        mcp: complete(["get_food_details"]),
        web: complete(["GET /api/app/food-details"]),
        app: complete(["GET /api/app/food-details"]),
        ios: complete(["GET /api/app/food-details"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.barcode",
        mcp: complete(["lookup_food_barcode", "lookup_barcode"]),
        web: complete(["GET /api/app/food-barcode"]),
        app: complete(["GET /api/app/food-barcode"]),
        ios: complete(["GET /api/app/food-barcode"]),
        iosBasis:
            "Shared bundle + cross-platform @capacitor/barcode-scanner: the iOS SPM package is present (Vision-framework backend on iOS; the runtime's ML Kit scanning-library hint is Android-only and ignored on iOS) and the camera usage string lands in the iOS Info.plist in this slice.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.saved.read",
        mcp: complete(["search_saved_foods", "list_saved_foods"]),
        web: complete(["GET /api/app/food-search", "GET /api/app/foods"]),
        app: complete(["GET /api/app/food-search", "GET /api/app/foods"]),
        ios: complete(["GET /api/app/food-search", "GET /api/app/foods"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.saved.write",
        mcp: complete(["save_food", "delete_saved_food"]),
        web: complete([
            "POST /api/app/foods",
            "DELETE /api/app/foods/:id",
            '[data-action="manage-saved-foods"]',
            '[data-action="select-saved-food-candidate"]',
            '[data-action="delete-saved-food"]',
            "#saved-food-form",
        ]),
        app: complete([
            "POST /api/app/foods",
            "DELETE /api/app/foods/:id",
            '[data-action="manage-saved-foods"]',
            '[data-action="select-saved-food-candidate"]',
            '[data-action="delete-saved-food"]',
            "#saved-food-form",
        ]),
        ios: complete([
            "POST /api/app/foods",
            "DELETE /api/app/foods/:id",
            '[data-action="manage-saved-foods"]',
            '[data-action="select-saved-food-candidate"]',
            '[data-action="delete-saved-food"]',
            "#saved-food-form",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "food.saved.reuse",
        mcp: complete(["mark_saved_food_used"]),
        // S5 correction: reuse is recorded server-side when the meal is
        // logged (markSavedFoodUsed inside the meal-create paths); the
        // standalone POST /foods/:id/used route is not a client entry
        // point on either surface.
        web: complete([
            "GET /api/app/food-search",
            "POST /api/app/meals",
            '[data-action="select-meal-option"]',
        ]),
        app: complete([
            "GET /api/app/food-search",
            "POST /api/app/meals",
            '[data-action="select-meal-option"]',
        ]),
        ios: complete([
            "GET /api/app/food-search",
            "POST /api/app/meals",
            '[data-action="select-meal-option"]',
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.summary",
        mcp: complete(["get_nutrition_summary"]),
        web: complete(["/api/app/today", "/api/app/meals"]),
        app: complete(["/api/app/today", "/api/app/meals"]),
        ios: complete(["/api/app/today", "/api/app/meals"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.goals",
        mcp: complete(["get_nutrition_goals", "set_nutrition_goals"]),
        web: complete(["/api/app/goals", "/app/settings/goals"]),
        app: complete(["/api/app/goals", "/app/settings/goals"]),
        ios: complete(["/api/app/goals", "/app/settings/goals"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "guidance.preferences",
        mcp: complete(["get_guidance_context", "set_guidance_preferences"]),
        web: complete([
            "GET /api/app/guidance/context",
            "GET/PUT /api/app/guidance/preferences",
        ]),
        app: complete([
            "GET /api/app/guidance/context",
            "GET/PUT /api/app/guidance/preferences",
        ]),
        ios: complete([
            "GET /api/app/guidance/context",
            "GET/PUT /api/app/guidance/preferences",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "guidance.goalPreview",
        mcp: complete(["preview_goal_change"]),
        web: complete(["POST /api/app/guidance/goals/preview"]),
        app: complete(["POST /api/app/guidance/goals/preview"]),
        ios: complete(["POST /api/app/guidance/goals/preview"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "guidance.goalCommit",
        mcp: complete(["commit_goal_change"]),
        web: complete(["POST /api/app/guidance/goals/commit"]),
        app: complete(["POST /api/app/guidance/goals/commit"]),
        ios: complete(["POST /api/app/guidance/goals/commit"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "guidance.goalHistory",
        mcp: complete(["get_goal_review", "get_goal_history"]),
        web: complete([
            "GET /api/app/guidance/goals/review",
            "GET /api/app/guidance/goals/history",
        ]),
        app: complete([
            "GET /api/app/guidance/goals/review",
            "GET /api/app/guidance/goals/history",
        ]),
        ios: complete([
            "GET /api/app/guidance/goals/review",
            "GET /api/app/guidance/goals/history",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.progress",
        mcp: complete(["get_goal_progress"]),
        web: complete(["GET /api/app/insights (progress)", "/api/app/today"]),
        app: complete(["GET /api/app/insights (progress)", "/api/app/today"]),
        ios: complete(["GET /api/app/insights (progress)", "/api/app/today"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.trends",
        mcp: complete(["get_trends"]),
        web: complete(["GET /api/app/insights (trends)", "/app/insights"]),
        app: complete(["GET /api/app/insights (trends)", "/app/insights"]),
        ios: complete(["GET /api/app/insights (trends)", "/app/insights"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.patterns",
        mcp: complete(["get_meal_patterns"]),
        web: complete(["GET /api/app/insights (patterns)", "/app/insights"]),
        app: complete(["GET /api/app/insights (patterns)", "/app/insights"]),
        ios: complete(["GET /api/app/insights (patterns)", "/app/insights"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "water.create",
        mcp: complete(["log_water"]),
        web: complete(["POST /api/app/water"]),
        app: complete(["POST /api/app/water"]),
        ios: complete(["POST /api/app/water"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "water.read",
        mcp: complete(["get_water_today", "get_water_by_date"]),
        web: complete([
            "/api/app/today",
            "GET /api/app/insights (water history)",
            "/app/insights",
        ]),
        app: complete([
            "/api/app/today",
            "GET /api/app/insights (water history)",
            "/app/insights",
        ]),
        ios: complete([
            "/api/app/today",
            "GET /api/app/insights (water history)",
            "/app/insights",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "water.update",
        mcp: complete(["update_water"]),
        web: complete(["PATCH /api/app/water/:id", "#water-history"]),
        app: complete(["PATCH /api/app/water/:id", "#water-history"]),
        ios: complete(["PATCH /api/app/water/:id", "#water-history"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "water.delete",
        mcp: complete(["delete_water"]),
        web: complete(["DELETE /api/app/water/:id", "#water-history"]),
        app: complete(["DELETE /api/app/water/:id", "#water-history"]),
        ios: complete(["DELETE /api/app/water/:id", "#water-history"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.create",
        mcp: complete(["log_weight"]),
        web: complete(["POST /api/app/weight"]),
        app: complete(["POST /api/app/weight"]),
        ios: complete(["POST /api/app/weight"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.read",
        mcp: complete([
            "get_weight_today",
            "get_weight_by_date",
            "get_weight_by_date_range",
        ]),
        web: complete([
            "/api/app/today",
            "GET /api/app/insights (weight history)",
            "/app/insights",
        ]),
        app: complete([
            "/api/app/today",
            "GET /api/app/insights (weight history)",
            "/app/insights",
        ]),
        ios: complete([
            "/api/app/today",
            "GET /api/app/insights (weight history)",
            "/app/insights",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.update",
        mcp: complete(["update_weight"]),
        web: complete(["PATCH /api/app/weight/:id", "#weight-history"]),
        app: complete(["PATCH /api/app/weight/:id", "#weight-history"]),
        ios: complete(["PATCH /api/app/weight/:id", "#weight-history"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.delete",
        mcp: complete(["delete_weight"]),
        web: complete(["DELETE /api/app/weight/:id", "#weight-history"]),
        app: complete(["DELETE /api/app/weight/:id", "#weight-history"]),
        ios: complete(["DELETE /api/app/weight/:id", "#weight-history"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.trends",
        mcp: complete(["get_weight_trends"]),
        web: complete([
            "GET /api/app/insights (weight trends)",
            "/app/insights",
        ]),
        app: complete([
            "GET /api/app/insights (weight trends)",
            "/app/insights",
        ]),
        ios: complete([
            "GET /api/app/insights (weight trends)",
            "/app/insights",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "weight.units",
        mcp: complete(["get_weight_unit", "set_weight_unit"]),
        web: complete(["/app/settings/profile"]),
        app: complete(["/app/settings/profile"]),
        ios: complete(["/app/settings/profile"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "preference.widgets",
        mcp: complete(["get_widget_display", "set_widget_display"]),
        web: complete(["/app/settings/profile"]),
        app: complete(["/app/settings/profile"]),
        ios: complete(["/app/settings/profile"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "preference.alcohol",
        mcp: complete(["get_alcohol_tracking", "set_alcohol_tracking"]),
        web: complete(["/app/settings/profile"]),
        app: complete(["/app/settings/profile"]),
        ios: complete(["/app/settings/profile"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "preference.timezone",
        mcp: complete(["get_timezone", "set_timezone"]),
        web: complete(["/app/settings/profile"]),
        app: complete(["/app/settings/profile"]),
        ios: complete(["/app/settings/profile"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.create",
        mcp: complete(["save_recipe", "save_meal_as_recipe"]),
        web: complete(["POST /api/app/recipes", "/app/recipes"]),
        app: complete(["POST /api/app/recipes", "/app/recipes"]),
        ios: complete(["POST /api/app/recipes", "/app/recipes"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.import",
        mcp: complete(["parse_recipe_url"]),
        web: complete([
            "POST /api/app/recipes/import-preview",
            '[data-action="import-recipe-url"]',
            "/app/recipes",
        ]),
        app: complete([
            "POST /api/app/recipes/import-preview",
            '[data-action="import-recipe-url"]',
            "/app/recipes",
        ]),
        ios: complete([
            "POST /api/app/recipes/import-preview",
            '[data-action="import-recipe-url"]',
            "/app/recipes",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.read",
        mcp: complete(["get_recipe"]),
        web: complete(["GET /api/app/recipes/:id"]),
        app: complete(["GET /api/app/recipes/:id"]),
        ios: complete(["GET /api/app/recipes/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.search",
        mcp: complete(["search_recipes"]),
        web: complete(["/api/app/planning", "#recipe-filter"]),
        app: complete(["/api/app/planning", "#recipe-filter"]),
        ios: complete(["/api/app/planning", "#recipe-filter"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.update",
        mcp: complete(["update_recipe"]),
        web: complete(["PATCH /api/app/recipes/:id"]),
        app: complete(["PATCH /api/app/recipes/:id"]),
        ios: complete(["PATCH /api/app/recipes/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.archive",
        mcp: complete(["delete_recipe"]),
        web: complete(["DELETE /api/app/recipes/:id"]),
        app: complete(["DELETE /api/app/recipes/:id"]),
        ios: complete(["DELETE /api/app/recipes/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "recipe.log",
        mcp: complete(["log_recipe"]),
        web: complete(["POST /api/app/recipes/:id/log"]),
        app: complete(["POST /api/app/recipes/:id/log"]),
        ios: complete(["POST /api/app/recipes/:id/log"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.read",
        mcp: complete(["get_meal_plan"]),
        web: complete(["/api/app/planning"]),
        app: complete(["/api/app/planning"]),
        ios: complete(["/api/app/planning"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.schedule",
        mcp: complete(["schedule_recipe"]),
        web: complete(["POST /api/app/recipes/:id/plan"]),
        app: complete(["POST /api/app/recipes/:id/plan"]),
        ios: complete(["POST /api/app/recipes/:id/plan"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.compose",
        mcp: complete(["save_recipe_and_plan"]),
        web: complete([
            "POST /api/app/recipes/compose",
            "[data-action=compose-recipe]",
            "/app/recipes",
        ]),
        app: complete([
            "POST /api/app/recipes/compose",
            "[data-action=compose-recipe]",
            "/app/recipes",
        ]),
        ios: complete([
            "POST /api/app/recipes/compose",
            "[data-action=compose-recipe]",
            "/app/recipes",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.draftCreate",
        mcp: complete(["create_meal_plan_draft"]),
        web: complete(["POST /api/app/planning/drafts"]),
        app: complete(["POST /api/app/planning/drafts"]),
        ios: complete(["POST /api/app/planning/drafts"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.draftEdit",
        mcp: complete([
            "get_meal_plan_draft",
            "update_meal_plan_draft",
            "cancel_meal_plan_draft",
        ]),
        web: complete(["GET/PATCH/DELETE /api/app/planning/drafts/:id"]),
        app: complete(["GET/PATCH/DELETE /api/app/planning/drafts/:id"]),
        ios: complete(["GET/PATCH/DELETE /api/app/planning/drafts/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.draftCommit",
        mcp: complete(["commit_meal_plan_draft"]),
        web: complete(["POST /api/app/planning/drafts/:id/commit"]),
        app: complete(["POST /api/app/planning/drafts/:id/commit"]),
        ios: complete(["POST /api/app/planning/drafts/:id/commit"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.recipeGenerate",
        mcp: complete(["validate_meal_plan_recipe"]),
        web: complete(["POST /api/app/planning/propose"]),
        app: complete(["POST /api/app/planning/propose"]),
        ios: complete(["POST /api/app/planning/propose"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.recipeCustomize",
        mcp: complete(["customize_meal_plan_recipe"]),
        web: complete(["PATCH /api/app/planning/drafts/:id"]),
        app: complete(["PATCH /api/app/planning/drafts/:id"]),
        ios: complete(["PATCH /api/app/planning/drafts/:id"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.groceryPreview",
        mcp: complete(["preview_plan_groceries"]),
        web: complete(["GET /api/app/planning/drafts/:id/groceries"]),
        app: complete(["GET /api/app/planning/drafts/:id/groceries"]),
        ios: complete(["GET /api/app/planning/drafts/:id/groceries"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.groceryCommit",
        mcp: complete(["confirm_plan_groceries"]),
        web: complete(["POST /api/app/planning/drafts/:id/groceries/commit"]),
        app: complete(["POST /api/app/planning/drafts/:id/groceries/commit"]),
        ios: complete(["POST /api/app/planning/drafts/:id/groceries/commit"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.swapPreview",
        mcp: complete(["preview_meal_swaps"]),
        web: complete(["GET /api/app/planning/:plannedMealId/swaps"]),
        app: complete(["GET /api/app/planning/:plannedMealId/swaps"]),
        ios: complete(["GET /api/app/planning/:plannedMealId/swaps"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.swapCommit",
        mcp: complete(["commit_meal_swap"]),
        web: complete(["POST /api/app/planning/:plannedMealId/swap"]),
        app: complete(["POST /api/app/planning/:plannedMealId/swap"]),
        ios: complete(["POST /api/app/planning/:plannedMealId/swap"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "mealPlan.swapUndo",
        mcp: complete(["undo_meal_swap"]),
        web: complete(["POST /api/app/planning/swaps/:changeId/undo"]),
        app: complete(["POST /api/app/planning/swaps/:changeId/undo"]),
        ios: complete(["POST /api/app/planning/swaps/:changeId/undo"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "grocery.read",
        mcp: complete(["get_grocery_list"]),
        web: complete(["/api/app/planning"]),
        app: complete(["/api/app/planning"]),
        ios: complete(["/api/app/planning"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "grocery.add",
        mcp: complete(["add_grocery_items"]),
        web: complete(["POST /api/app/groceries/items"]),
        app: complete(["POST /api/app/groceries/items"]),
        ios: complete(["POST /api/app/groceries/items"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "grocery.purchase",
        mcp: complete(["mark_grocery_item_purchased"]),
        web: complete([
            "POST /api/app/groceries/items/:id/purchased",
            "POST /api/app/groceries/clear-purchased",
        ]),
        app: complete([
            "POST /api/app/groceries/items/:id/purchased",
            "POST /api/app/groceries/clear-purchased",
        ]),
        ios: complete([
            "POST /api/app/groceries/items/:id/purchased",
            "POST /api/app/groceries/clear-purchased",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "grocery.manage",
        mcp: websiteOnly([]),
        web: complete([
            "PATCH /api/app/groceries/items/:id",
            "DELETE /api/app/groceries/items/:id",
        ]),
        app: complete([
            "PATCH /api/app/groceries/items/:id",
            "DELETE /api/app/groceries/items/:id",
        ]),
        ios: complete([
            "PATCH /api/app/groceries/items/:id",
            "DELETE /api/app/groceries/items/:id",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException:
            "The MCP catalog exposes explicit grocery additions and purchase state; direct item editing and removal are website list-management controls.",
        gap: null,
        targetPr: null,
    },
    {
        id: "nutrition.export",
        mcp: complete(["export_meals"]),
        web: complete(["POST /api/app/export/meals", "/app/settings/data"]),
        app: complete(["POST /api/app/export/meals", "/app/settings/data"]),
        ios: partial(["POST /api/app/export/meals", "/app/settings/data"]),
        iosBasis:
            "Shared bundle: the meals CSV export rides the same POST /api/app/export path as account.export on both platforms; the final file handoff out of the WebView differs — see iosGap.",
        iosGap: "Same handoff gap as account.export: Android relies on Capacitor's Bridge.launchIntent to hand the download URL to the system browser; the iOS shell has no equivalent download/browser handoff today, so the CSV can be requested in the iOS app but the file handoff is not built/proven on iOS.",
        iosTargetPr: "IOS-PLATFORM follow-up — iOS export download handoff",
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "account.delete",
        mcp: complete(["delete_account"]),
        web: complete(["/app/settings/account"]),
        app: complete(["/app/settings/account"]),
        ios: complete(["/app/settings/account"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "connection.status",
        mcp: complete(["get_connection_status"]),
        web: complete(["/app/settings/connections"]),
        app: complete(["/app/settings/connections"]),
        ios: complete(["/app/settings/connections"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "billing.checkout",
        mcp: websiteOnly([]),
        web: complete(["/billing/checkout", "/app/settings/billing"]),
        app: missing(),
        ios: missing(),
        iosBasis:
            "Website-only by standing commerce law, exactly as on Android: Stripe checkout must not run inside the packaged app. The iOS in-app Premium purchase path is the StoreKit rail (IOS-BILLING), which has no native plugin yet, so no checkout entry point is available in the iOS app.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException:
            "Billing is intentionally website-only and must not be advertised through MCP.",
        gap: null,
        targetPr: null,
    },
    {
        id: "billing.portal",
        mcp: websiteOnly([]),
        web: complete(["/billing/portal", "/app/settings/billing"]),
        app: missing(),
        ios: missing(),
        iosBasis:
            "Website-only by standing commerce law, exactly as on Android: Stripe subscription management must not run inside the packaged app. The iOS manage door arrives with the StoreKit rail (IOS-BILLING), which has no native plugin yet, so no portal entry point is available in the iOS app.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException:
            "Stripe subscription management is intentionally website-only.",
        gap: null,
        targetPr: null,
    },
    {
        id: "mcp.connection.revoke",
        mcp: websiteOnly([]),
        web: complete(["DELETE /api/app/connections/:tokenFamilyId"]),
        // S5: the S0 website-only declaration was stale — the packaged
        // SPA's Connections settings surface renders in the bundle and
        // revokes through this exact route over the bearer transport
        // (exercised in e2e/mobile-parity.e2e.ts). MCP itself still
        // cannot revoke connections.
        app: complete(["DELETE /api/app/connections/:tokenFamilyId"]),
        ios: complete(["DELETE /api/app/connections/:tokenFamilyId"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "household.manage",
        mcp: websiteOnly([]),
        web: complete(["/api/app/household/manage", "/app/household"]),
        // S5: stale S0 declaration — the Household surface lives inside
        // the packaged SPA (create form, member list, invite form all
        // exercised in e2e/mobile-parity.e2e.ts over bearer transport).
        app: complete(["/api/app/household/manage", "/app/household"]),
        ios: complete(["/api/app/household/manage", "/app/household"]),
        iosBasis:
            "Shared bundle: the surface lives inside the packaged SPA (the evidence class S5 used for the Android channel) and iOS packages that same SPA; no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "account.export",
        mcp: websiteOnly([]),
        // S5 correction: the complete-account export surface is
        // Settings → Data on both surfaces (the old "/account/portal"
        // web entry point named the post-login landing, not export).
        // The packaged app posts for the export and hands the returned
        // download URL out of the WebView (Capacitor opens
        // non-localhost navigations in the system browser).
        web: complete(["POST /api/app/export", "/app/settings/data"]),
        app: complete(["POST /api/app/export", "/app/settings/data"]),
        ios: partial(["POST /api/app/export", "/app/settings/data"]),
        iosBasis:
            "Shared bundle: Settings → Data and POST /api/app/export are inside the packaged SPA on both platforms; the final file handoff out of the WebView differs — see iosGap.",
        iosGap: "The Android completeness proof relies on Capacitor's Bridge.launchIntent handing the returned download URL to the system browser; the iOS shell has no equivalent download/browser handoff today (a WKWebView does not perform the attachment download), so the export can be requested in the iOS app but the file handoff is not built/proven on iOS.",
        iosTargetPr: "IOS-PLATFORM follow-up — iOS export download handoff",
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.create",
        mcp: complete(["start_cook"]),
        web: complete(["POST /api/app/cooks"]),
        app: complete(["POST /api/app/cooks"]),
        ios: complete(["POST /api/app/cooks"]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.read",
        mcp: complete(["get_cook", "search_cooks"]),
        web: complete([
            "GET /api/app/cooks",
            "GET /api/app/cooks/:id",
            "/app/cooks",
        ]),
        app: complete([
            "GET /api/app/cooks",
            "GET /api/app/cooks/:id",
            "/app/cooks",
        ]),
        ios: complete([
            "GET /api/app/cooks",
            "GET /api/app/cooks/:id",
            "/app/cooks",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.update",
        mcp: complete([
            "update_cook",
            "update_cook_dish",
            "correct_cook_event",
            "record_cook_result",
            "set_preferred_cook",
        ]),
        web: complete([
            "POST /api/app/cooks/:id/updates",
            "PATCH /api/app/cooks/:cookId/dishes/:dishId",
            "PATCH /api/app/cooks/:cookId/events/:eventId",
            "POST /api/app/cooks/:id/outcome",
            "POST /api/app/cooks/:id/preferred",
        ]),
        app: complete([
            "POST /api/app/cooks/:id/updates",
            "PATCH /api/app/cooks/:cookId/dishes/:dishId",
            "PATCH /api/app/cooks/:cookId/events/:eventId",
            "POST /api/app/cooks/:id/outcome",
            "POST /api/app/cooks/:id/preferred",
        ]),
        ios: complete([
            "POST /api/app/cooks/:id/updates",
            "PATCH /api/app/cooks/:cookId/dishes/:dishId",
            "PATCH /api/app/cooks/:cookId/events/:eventId",
            "POST /api/app/cooks/:id/outcome",
            "POST /api/app/cooks/:id/preferred",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.lifecycle",
        mcp: complete(["finish_cook", "reopen_cook", "delete_cook"]),
        web: complete([
            "POST /api/app/cooks/:id/finish",
            "POST /api/app/cooks/:id/reopen",
            "DELETE /api/app/cooks/:id",
        ]),
        app: complete([
            "POST /api/app/cooks/:id/finish",
            "POST /api/app/cooks/:id/reopen",
            "DELETE /api/app/cooks/:id",
        ]),
        ios: complete([
            "POST /api/app/cooks/:id/finish",
            "POST /api/app/cooks/:id/reopen",
            "DELETE /api/app/cooks/:id",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.iterate",
        mcp: complete(["repeat_cook", "compare_cooks"]),
        web: complete([
            "POST /api/app/cooks/:id/repeat",
            "GET /api/app/cooks/compare",
        ]),
        app: complete([
            "POST /api/app/cooks/:id/repeat",
            "GET /api/app/cooks/compare",
        ]),
        ios: complete([
            "POST /api/app/cooks/:id/repeat",
            "GET /api/app/cooks/compare",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.recipe",
        mcp: complete(["prepare_cook_recipe_draft", "save_cook_as_recipe"]),
        web: complete([
            "POST /api/app/cooks/:id/recipe-draft",
            "POST /api/app/cooks/:id/save-recipe",
        ]),
        app: complete([
            "POST /api/app/cooks/:id/recipe-draft",
            "POST /api/app/cooks/:id/save-recipe",
        ]),
        ios: complete([
            "POST /api/app/cooks/:id/recipe-draft",
            "POST /api/app/cooks/:id/save-recipe",
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
    {
        id: "cook.nutrition",
        mcp: complete(["log_cook_portion"]),
        web: complete([
            "POST /api/app/recipes/:id/log",
            '[data-action="log-cook-dish"]',
        ]),
        app: complete([
            "POST /api/app/recipes/:id/log",
            '[data-action="log-cook-dish"]',
        ]),
        ios: complete([
            "POST /api/app/recipes/:id/log",
            '[data-action="log-cook-dish"]',
        ]),
        iosBasis:
            "Shared bundle: iOS packages the same .mobile-web artifact as Android (same build script, cap sync ios) and reaches the same routes over the bearer transport; this outcome has no platform-specific native dependency.",
        iosGap: null,
        iosTargetPr: null,
        intentionalChannelException: null,
        gap: null,
        targetPr: null,
    },
] as const satisfies readonly CapabilityContract[];

/**
 * Cross-cutting iOS native gaps (IOS-PLATFORM) that no single manifest
 * row owns. Per the program testing law, a gap that cannot be exercised
 * in Actions is recorded with its owner and closest automated proxy —
 * never left silent. Row-level consequences are encoded in the rows
 * themselves (billing.* missing, meal.photoLog and the export rows
 * partial); these entries cover the platform pieces underneath rows
 * whose bundle-level outcomes are otherwise at parity.
 */
export const IOS_CHANNEL_NATIVE_GAPS = [
    {
        id: "ios.native.secureSession",
        summary:
            "No iOS counterpart of the Android MunchSecureSession plugin (Java, Keystore-encrypted storage) exists: ios/ ships only the stock Capacitor plugins (App, Camera, BarcodeScanner). The shared runtime treats a missing plugin as signed-out, so on iOS today the session token and pending magic-link state have no native persistent store. PR #197 (IOS-PREP) established no custom-Swift-plugin pattern to follow, and a hand-wired local SPM plugin would be overwritten by `cap sync`, so this needs a first-party plugin package, not a slice-local edit.",
        owner: "IOS-PLATFORM follow-up — iOS secure-session plugin package",
        closestProxy:
            "IOS-SMOKE boots the packaged bundle on the simulator with a fixture session and exercises the core flows; the manifest's ios verdicts are asserted at the same bundle/transport evidence level as S5's Android verdicts.",
    },
    {
        id: "ios.native.googleSignIn",
        summary:
            "Server side is wired (IOS-AUTH): the Better Auth Apple provider is registered from the MUNCH_APPLE_* env set with both ID-token audiences (Services ID for web, bundle ID for the packaged app), and the Google provider accepts the iOS client ID as an ID-token audience alongside web/Android. What does not exist is the native half: no iOS counterpart of the Android MunchGoogleSignIn plugin (Credential Manager) and no ASAuthorization plugin, so the packaged app cannot yet obtain or hand off an Apple/Google ID token; magic-link sign-in is the packaged iOS path today. No manifest row is a sign-in outcome, so no row verdict changes.",
        owner: "IOS-AUTH follow-up — first-party iOS auth plugin package (native half); server wiring landed with IOS-AUTH",
        closestProxy:
            "CI proves the server half end to end with fixture identifiers (Apple provider registration, generated client secret, initiation, Amendment I link flip; Google iOS audience in the provider + google-config). The native flow is exercisable only when the plugin package lands; its acceptance test is named in the IOS-AUTH PR body.",
    },
    {
        id: "ios.native.storeBilling",
        summary:
            "No iOS counterpart of the Android MunchPlayBilling plugin exists; StoreKit verification writes into the same rail-neutral subscription tables once built. Reflected in the billing.checkout / billing.portal ios verdicts (missing, website-only exception).",
        owner: "IOS-BILLING (Amendment H billing parity)",
        closestProxy:
            "Server-side rail-neutral subscription model already accepts the apple_app_store provider (migration 0029 family); no in-app purchase can be exercised until the plugin lands.",
    },
    {
        id: "ios.native.ads",
        summary:
            "No iOS counterpart of the Android MunchAds plugin (AdMob + UMP) exists and the Munch iOS app does not exist in AdMob yet. Ads are not a capability outcome — no manifest row carries advertising — so no row verdict changes; the single Today slot stays dark on iOS until this lands.",
        owner: "IOS-ADS (Amendment H ads parity)",
        closestProxy:
            "The shared bundle's ad slot is flag-gated and Premium-hidden on every platform; iOS renders it dark because the native bridge is absent and the remote flag is off.",
    },
] as const;

export type CapabilityId = (typeof CAPABILITY_MANIFEST)[number]["id"];

/** Every registered MCP tool must be assigned to an outcome capability. */
export const MCP_TOOL_CAPABILITY_MAP = {
    add_grocery_items: "grocery.add",
    add_meal_draft_question: "mealDraft.update",
    answer_meal_draft_question: "mealDraft.update",
    bulk_import_meals: "meal.import",
    cancel_meal_draft: "mealDraft.cancel",
    compare_cooks: "cook.iterate",
    correct_cook_event: "cook.update",
    confirm_meal_draft: "mealDraft.confirm",
    delete_account: "account.delete",
    delete_meal: "meal.delete",
    delete_recipe: "recipe.archive",
    delete_saved_food: "food.saved.write",
    delete_water: "water.delete",
    delete_weight: "weight.delete",
    delete_cook: "cook.lifecycle",
    export_meals: "nutrition.export",
    get_guidance_context: "guidance.preferences",
    get_goal_history: "guidance.goalHistory",
    get_alcohol_tracking: "preference.alcohol",
    get_connection_status: "connection.status",
    get_cook: "cook.read",
    get_food_details: "food.inspect",
    get_goal_progress: "nutrition.progress",
    get_goal_review: "guidance.goalHistory",
    get_grocery_list: "grocery.read",
    get_meal_details: "meal.details",
    get_meal_draft: "mealDraft.read",
    get_meal_patterns: "nutrition.patterns",
    get_meal_plan: "mealPlan.read",
    get_meals_by_date: "meal.read",
    get_meals_by_date_range: "meal.read",
    get_meals_today: "meal.read",
    get_nutrition_goals: "nutrition.goals",
    get_nutrition_provenance: "nutrition.provenance",
    get_nutrition_summary: "nutrition.summary",
    get_recipe: "recipe.read",
    get_timezone: "preference.timezone",
    get_trends: "nutrition.trends",
    get_water_by_date: "water.read",
    get_water_today: "water.read",
    get_weight_by_date: "weight.read",
    get_weight_by_date_range: "weight.read",
    get_weight_today: "weight.read",
    get_weight_trends: "weight.trends",
    get_weight_unit: "weight.units",
    get_widget_display: "preference.widgets",
    get_weekly_checkin: "nutrition.weeklyCheckin",
    get_daily_guidance: "nutrition.dailyGuidance",
    create_meal_plan_draft: "mealPlan.draftCreate",
    get_meal_plan_draft: "mealPlan.draftEdit",
    validate_meal_plan_recipe: "mealPlan.recipeGenerate",
    update_meal_plan_draft: "mealPlan.draftEdit",
    customize_meal_plan_recipe: "mealPlan.recipeCustomize",
    commit_meal_plan_draft: "mealPlan.draftCommit",
    cancel_meal_plan_draft: "mealPlan.draftEdit",
    preview_plan_groceries: "mealPlan.groceryPreview",
    confirm_plan_groceries: "mealPlan.groceryCommit",
    preview_meal_swaps: "mealPlan.swapPreview",
    commit_meal_swap: "mealPlan.swapCommit",
    undo_meal_swap: "mealPlan.swapUndo",
    list_saved_foods: "food.saved.read",
    log_meal: "meal.create",
    log_cook_portion: "cook.nutrition",
    log_recipe: "recipe.log",
    log_water: "water.create",
    log_weight: "weight.create",
    lookup_barcode: "food.barcode",
    lookup_food_barcode: "food.barcode",
    mark_grocery_item_purchased: "grocery.purchase",
    mark_saved_food_used: "food.saved.reuse",
    parse_recipe_url: "recipe.import",
    prepare_cook_recipe_draft: "cook.recipe",
    prepare_meal_confirmation: "mealDraft.review",
    prepare_meal_review: "mealDraft.create",
    resolve_meal_review: "mealDraft.confirm",
    save_food: "food.saved.write",
    save_meal_as_recipe: "recipe.create",
    save_recipe: "recipe.create",
    save_recipe_and_plan: "mealPlan.compose",
    save_cook_as_recipe: "cook.recipe",
    schedule_recipe: "mealPlan.schedule",
    search_foods: "food.search",
    search_meals: "meal.search",
    search_recipes: "recipe.search",
    search_saved_foods: "food.saved.read",
    search_cooks: "cook.read",
    set_alcohol_tracking: "preference.alcohol",
    set_nutrition_goals: "nutrition.goals",
    set_guidance_preferences: "guidance.preferences",
    preview_goal_change: "guidance.goalPreview",
    commit_goal_change: "guidance.goalCommit",
    set_timezone: "preference.timezone",
    set_weight_unit: "weight.units",
    set_widget_display: "preference.widgets",
    set_preferred_cook: "cook.update",
    start_cook: "cook.create",
    start_meal_draft: "mealDraft.create",
    start_meal_import: "meal.import",
    finish_cook: "cook.lifecycle",
    reopen_cook: "cook.lifecycle",
    repeat_cook: "cook.iterate",
    record_cook_result: "cook.update",
    update_cook: "cook.update",
    update_cook_dish: "cook.update",
    update_meal: "meal.update",
    update_meal_draft: "mealDraft.update",
    update_recipe: "recipe.update",
    update_water: "water.update",
    update_weight: "weight.update",
    upsert_meal_draft_item: "mealDraft.update",
} as const satisfies Readonly<Record<string, CapabilityId>>;

export type McpToolName = keyof typeof MCP_TOOL_CAPABILITY_MAP;

export function assertCapabilityManifest(): string[] {
    const errors: string[] = [];
    const ids = new Set<string>();
    const mappedTools = new Map<string, string>();

    for (const capability of CAPABILITY_MANIFEST) {
        // Captured before the channel checks: the discriminant checks
        // below narrow the manifest's literal union, and this id must
        // stay reachable in every branch.
        const capabilityId: string = capability.id;
        if (ids.has(capability.id)) {
            errors.push(`Duplicate capability id: ${capability.id}`);
        }
        ids.add(capability.id);

        for (const [channelName, channel] of [
            ["mcp", capability.mcp],
            ["web", capability.web],
            ["app", capability.app],
            ["ios", capability.ios],
        ] as const) {
            if (channel.available && channel.entryPoints.length === 0) {
                errors.push(
                    `${capability.id}: ${channelName} is available but has no entry point`,
                );
            }
            if (!channel.available && channel.coverage === "complete") {
                errors.push(
                    `${capability.id}: ${channelName} cannot be complete while unavailable`,
                );
            }
        }

        if (
            capability.app.coverage === "missing" &&
            !capability.intentionalChannelException
        ) {
            errors.push(
                `${capability.id}: app channel is missing without an explicit intentional channel exception`,
            );
        }
        if (
            !capability.intentionalChannelException &&
            capability.app.coverage === "partial" &&
            (!capability.gap || !capability.targetPr)
        ) {
            errors.push(
                `${capability.id}: partial app coverage needs a documented gap and target PR`,
            );
        }

        // IOS-PLATFORM: the ios channel is a first-class citizen with
        // the same discipline as app — every verdict carries a stated
        // basis, a missing verdict is only honest as a declared
        // exception, and a partial verdict must name its iOS-specific
        // gap and owning follow-up instead of borrowing Android's.
        if (!capability.iosBasis || capability.iosBasis.trim().length === 0) {
            errors.push(
                `${capability.id}: ios channel needs a stated basis (iosBasis)`,
            );
        }
        if (
            capability.ios.coverage === "missing" &&
            !capability.intentionalChannelException
        ) {
            errors.push(
                `${capability.id}: ios channel is missing without an explicit intentional channel exception`,
            );
        }
        if (
            capability.ios.coverage === "partial" &&
            (!capability.iosGap || !capability.iosTargetPr)
        ) {
            errors.push(
                `${capability.id}: partial ios coverage needs a documented iosGap and iosTargetPr`,
            );
        }
        if (capability.ios.coverage === "complete" && capability.iosGap) {
            errors.push(
                `${capability.id}: complete ios coverage cannot also carry an unresolved iosGap`,
            );
        }

        if (capability.intentionalChannelException && capability.gap) {
            errors.push(
                `${capabilityId}: intentional channel exceptions cannot also be unresolved gaps`,
            );
        }
        if (
            !capability.intentionalChannelException &&
            (capability.web.coverage === "missing" ||
                capability.web.coverage === "partial") &&
            (!capability.gap || !capability.targetPr)
        ) {
            errors.push(
                `${capability.id}: incomplete web coverage needs a documented gap and target PR`,
            );
        }
    }

    for (const [tool, capabilityId] of Object.entries(
        MCP_TOOL_CAPABILITY_MAP,
    )) {
        if (!ids.has(capabilityId)) {
            errors.push(`${tool}: maps to unknown capability ${capabilityId}`);
        }
        if (mappedTools.has(tool)) {
            errors.push(`Duplicate MCP tool mapping: ${tool}`);
        }
        mappedTools.set(tool, capabilityId);
    }

    for (const capability of CAPABILITY_MANIFEST) {
        for (const tool of capability.mcp.entryPoints) {
            if (
                MCP_TOOL_CAPABILITY_MAP[tool as McpToolName] !== capability.id
            ) {
                errors.push(
                    `${capability.id}: MCP entry point ${tool} is not mapped back to this capability`,
                );
            }
        }
    }

    return errors;
}
