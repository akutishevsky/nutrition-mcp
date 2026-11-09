import { Hono } from "hono";
import { z } from "zod";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import { resolveRequestMunchCapabilities } from "../billing/capabilities.js";
import {
    requirePlanningAccess,
    requirePlanningScope,
} from "../mcp-capability-guard.js";
import { validateTz } from "../tz.js";
import {
    cancelGuidedPlanDraft,
    commitGoalChange,
    commitGuidedPlanDraft,
    commitMealSwap,
    confirmGuidedPlanGroceries,
    createGuidedPlanDraft,
    getDailyGuidance,
    getGoalReviewReadiness,
    getGuidanceContext,
    getGuidancePreferences,
    getGuidedPlanDraft,
    getWeeklyGuidance,
    listGoalHistory,
    previewGoalChange,
    previewGuidedPlanGroceries,
    previewMealSwaps,
    undoMealSwap,
    updateGuidancePreferences,
    updateGuidedPlanDraft,
} from "../guidance-repository.js";
import { websiteGuidanceAiConfig } from "../website-ai-config.js";
import { generateGuidanceProposals } from "./guidance-ai.js";

function privateJson(c: any, value: unknown, status = 200) {
    c.header("Cache-Control", "private, no-store");
    return c.json(value, status);
}

function currentUserId(c: any): string {
    const userId = c.get("munchUserId");
    if (typeof userId !== "string" || userId.length === 0) {
        throw new Error("Authenticated user context is unavailable");
    }
    return userId;
}

function requiredParam(c: any, name: string): string {
    const value = c.req.param(name);
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`${name} is required`);
    }
    return value;
}

function bodyObject(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be a JSON object`);
    }
    return value as Record<string, unknown>;
}

function queryRequired(value: string | undefined, label: string): string {
    if (!value) throw new Error(`${label} is required`);
    return value;
}

async function authorizedScope(
    c: any,
    userId: string,
    scope: unknown,
    write: boolean,
) {
    const selected = scope === "household" ? "household" : "personal";
    const capabilities = await resolveRequestMunchCapabilities(c, userId);
    return requirePlanningScope(selected, capabilities, write);
}

async function authorizeDraft(
    c: any,
    userId: string,
    draftId: string,
    write: boolean,
) {
    const draft = await getGuidedPlanDraft(userId, draftId);
    if (!draft) throw new Error("Plan draft was not found");
    const scope = await authorizedScope(c, userId, draft.scope.type, write);
    if (
        draft.scope.type === "household" &&
        scope.type === "household" &&
        scope.householdId !== draft.scope.householdId
    ) {
        throw new Error("Household planning scope is unavailable");
    }
    return draft;
}

const aiProposalRequest = z
    .object({
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timezone: z.string().min(1).max(100),
        scope: z.enum(["personal", "household"]).default("personal"),
        household_id: z.string().uuid().optional(),
        meal_slots: z
            .array(
                z
                    .object({
                        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        meal_slot: z.enum([
                            "breakfast",
                            "lunch",
                            "dinner",
                            "snack",
                        ]),
                        servings: z.number().positive().max(50).default(1),
                    })
                    .strict(),
            )
            .min(1)
            .max(21),
        request: z.string().trim().max(800).optional(),
    })
    .strict();

async function proposeRecipes(c: any, userId: string, body: unknown) {
    const request = aiProposalRequest.parse(body);
    if (!validateTz(request.timezone)) throw new Error("Invalid timezone");
    const selectedScope = await authorizedScope(c, userId, request.scope, true);
    if (
        request.scope === "household" &&
        request.household_id &&
        (selectedScope.type !== "household" ||
            request.household_id !== selectedScope.householdId)
    ) {
        throw new Error("Household planning scope is unavailable");
    }
    const context = await getGuidanceContext({
        userId,
        scope: selectedScope,
        startDate: request.start_date,
        endDate: request.end_date,
    });
    const config = websiteGuidanceAiConfig();
    if (!config) {
        return {
            status: "manual_fallback",
            code: "guidance_ai_unavailable",
            manual_entry_available: true,
            message:
                "Recipe suggestions are unavailable. You can build the plan from saved recipes or enter recipes manually.",
        };
    }
    const slots = request.meal_slots.map((slot) => ({
        date: slot.date,
        meal_slot: slot.meal_slot,
        servings: slot.servings,
    }));
    const safeContext = {
        preferences: context.preferences,
        saved_recipe_names: context.saved_recipes
            .slice(0, 40)
            .map((recipe) =>
                String((recipe as Record<string, unknown>).name ?? ""),
            ),
        recent_plan_history: context.recent_plan_history
            .slice(0, 40)
            .map((recipe) => ({
                name: String((recipe as Record<string, unknown>).name ?? ""),
                ingredients: Array.isArray(
                    (recipe as Record<string, unknown>).ingredients,
                )
                    ? (
                          (recipe as Record<string, unknown>)
                              .ingredients as unknown[]
                      )
                          .slice(0, 16)
                          .map(String)
                    : [],
            })),
    };
    // The model call itself lives in guidance-ai.ts behind an injectable
    // transport (recorded-fixture seam, S2); this handler keeps auth,
    // scope, and context building.
    return generateGuidanceProposals({
        config,
        slots,
        safeContext,
        userRequest: request.request ?? "",
    });
}

export function createGuidanceRouter(): Hono {
    const app = new Hono();
    app.use("/api/app/*", requireWebSession);

    app.get("/api/app/guidance/context", async (c) => {
        const userId = currentUserId(c);
        const scope = await authorizedScope(
            c,
            userId,
            c.req.query("scope"),
            false,
        );
        return privateJson(
            c,
            await getGuidanceContext({
                userId,
                scope,
                startDate: c.req.query("start"),
                endDate: c.req.query("end"),
            }),
        );
    });

    app.get("/api/app/guidance/preferences", async (c) =>
        privateJson(c, {
            preferences: await getGuidancePreferences(currentUserId(c)),
        }),
    );

    app.put("/api/app/guidance/preferences", requireSameOrigin, async (c) => {
        const body = bodyObject(await c.req.json(), "Guidance preferences");
        if (body.confirm !== true)
            throw new Error(
                "Explicit confirmation is required to save guidance preferences",
            );
        const saved = await updateGuidancePreferences(
            currentUserId(c),
            body.preferences,
            Number.isInteger(body.expected_version)
                ? Number(body.expected_version)
                : undefined,
        );
        return privateJson(c, { preferences: saved });
    });

    app.get("/api/app/guidance/goals/review", async (c) =>
        privateJson(c, await getGoalReviewReadiness(currentUserId(c))),
    );
    app.get("/api/app/guidance/goals/history", async (c) =>
        privateJson(
            c,
            await listGoalHistory(
                currentUserId(c),
                Number(c.req.query("limit") ?? 20),
            ),
        ),
    );
    app.post(
        "/api/app/guidance/goals/preview",
        requireSameOrigin,
        async (c) => {
            const body = bodyObject(await c.req.json(), "Goal preview");
            return privateJson(
                c,
                await previewGoalChange({
                    userId: currentUserId(c),
                    targets: body.targets,
                    idempotencyKey: String(body.idempotency_key ?? ""),
                    rationale: Array.isArray(body.rationale)
                        ? body.rationale.map(String)
                        : undefined,
                }),
            );
        },
    );
    app.post("/api/app/guidance/goals/commit", requireSameOrigin, async (c) => {
        const body = bodyObject(await c.req.json(), "Goal confirmation");
        return privateJson(
            c,
            await commitGoalChange({
                userId: currentUserId(c),
                proposalId: String(body.proposal_id ?? ""),
                expectedRevision: Number(body.expected_revision),
                confirm: body.confirm === true,
                idempotencyKey: String(body.idempotency_key ?? ""),
                origin: "website",
            }),
        );
    });

    app.get("/api/app/guidance/today", async (c) =>
        privateJson(
            c,
            await getDailyGuidance({
                userId: currentUserId(c),
                date: queryRequired(c.req.query("date"), "date"),
            }),
        ),
    );
    app.get("/api/app/insights/checkin", async (c) =>
        privateJson(
            c,
            await getWeeklyGuidance({
                userId: currentUserId(c),
                startDate: queryRequired(c.req.query("start"), "start"),
                endDate: queryRequired(c.req.query("end"), "end"),
                timezone: c.req.query("timezone"),
            }),
        ),
    );

    app.post("/api/app/planning/propose", requireSameOrigin, async (c) => {
        const userId = currentUserId(c);
        const body = await c.req.json();
        // AI features are free for every account (Amendment D):
        // no entitlement check and no meter at this call site. A
        // manual_fallback result simply means the AI call was
        // unavailable — manual planning always works too.
        return privateJson(c, await proposeRecipes(c, userId, body));
    });
    app.post("/api/app/planning/drafts", requireSameOrigin, async (c) => {
        const userId = currentUserId(c);
        const body = bodyObject(await c.req.json(), "Plan draft");
        const scope = await authorizedScope(c, userId, body.scope, true);
        if (
            body.scope === "household" &&
            body.household_id &&
            (scope.type !== "household" ||
                body.household_id !== scope.householdId)
        ) {
            throw new Error("Household planning scope is unavailable");
        }
        return privateJson(
            c,
            await createGuidedPlanDraft(
                {
                    ...body,
                    household_id:
                        scope.type === "household"
                            ? scope.householdId
                            : undefined,
                },
                userId,
            ),
        );
    });
    app.get("/api/app/planning/drafts/:id", async (c) => {
        const userId = currentUserId(c);
        const draft = await authorizeDraft(
            c,
            userId,
            requiredParam(c, "id"),
            false,
        );
        return privateJson(c, { draft });
    });
    app.patch("/api/app/planning/drafts/:id", requireSameOrigin, async (c) => {
        const userId = currentUserId(c);
        const draftId = requiredParam(c, "id");
        await authorizeDraft(c, userId, draftId, true);
        const body = bodyObject(await c.req.json(), "Plan draft update");
        return privateJson(
            c,
            await updateGuidedPlanDraft({
                userId,
                draftId,
                expectedVersion: Number(body.expected_version),
                items: body.items,
                preferencesOverride: body.preferences_override,
            }),
        );
    });
    app.delete("/api/app/planning/drafts/:id", requireSameOrigin, async (c) => {
        const userId = currentUserId(c);
        const draftId = requiredParam(c, "id");
        await authorizeDraft(c, userId, draftId, true);
        const body = bodyObject(await c.req.json(), "Draft cancellation");
        return privateJson(
            c,
            await cancelGuidedPlanDraft({
                userId,
                draftId,
                expectedVersion: Number(body.expected_version),
                confirm: body.confirm === true,
            }),
        );
    });
    app.post(
        "/api/app/planning/drafts/:id/commit",
        requireSameOrigin,
        async (c) => {
            const userId = currentUserId(c);
            const draftId = requiredParam(c, "id");
            await authorizeDraft(c, userId, draftId, true);
            const body = bodyObject(await c.req.json(), "Plan confirmation");
            return privateJson(
                c,
                await commitGuidedPlanDraft({
                    userId,
                    draftId,
                    expectedVersion: Number(body.expected_version),
                    confirm: body.confirm === true,
                }),
            );
        },
    );
    app.get("/api/app/planning/drafts/:id/groceries", async (c) => {
        const userId = currentUserId(c);
        const draftId = requiredParam(c, "id");
        await authorizeDraft(c, userId, draftId, false);
        return privateJson(
            c,
            await previewGuidedPlanGroceries(userId, draftId),
        );
    });
    app.post(
        "/api/app/planning/drafts/:id/groceries/commit",
        requireSameOrigin,
        async (c) => {
            const userId = currentUserId(c);
            const draftId = requiredParam(c, "id");
            await authorizeDraft(c, userId, draftId, true);
            const body = bodyObject(await c.req.json(), "Grocery confirmation");
            return privateJson(
                c,
                await confirmGuidedPlanGroceries({
                    userId,
                    draftId,
                    selectedIndices: Array.isArray(body.selected_indices)
                        ? body.selected_indices.map(Number)
                        : [],
                    confirm: body.confirm === true,
                    idempotencyKey: String(body.idempotency_key ?? ""),
                }),
            );
        },
    );
    app.get("/api/app/planning/:plannedMealId/swaps", async (c) => {
        const userId = currentUserId(c);
        const plannedMealId = requiredParam(c, "plannedMealId");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        requirePlanningAccess(capabilities, "all", false);
        return privateJson(
            c,
            await previewMealSwaps({ userId, plannedMealId }),
        );
    });
    app.post(
        "/api/app/planning/:plannedMealId/swap",
        requireSameOrigin,
        async (c) => {
            const userId = currentUserId(c);
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                userId,
            );
            requirePlanningAccess(capabilities, "all", true);
            const body = bodyObject(await c.req.json(), "Meal swap");
            return privateJson(
                c,
                await commitMealSwap({
                    userId,
                    plannedMealId: requiredParam(c, "plannedMealId"),
                    recipeId: String(body.recipe_id ?? ""),
                    recipeRevisionId: String(body.recipe_revision_id ?? ""),
                    expectedVersion: Number(body.expected_version),
                    confirm: body.confirm === true,
                    idempotencyKey: String(body.idempotency_key ?? ""),
                }),
            );
        },
    );
    app.post(
        "/api/app/planning/swaps/:changeId/undo",
        requireSameOrigin,
        async (c) => {
            const userId = currentUserId(c);
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                userId,
            );
            requirePlanningAccess(capabilities, "all", true);
            const body = bodyObject(await c.req.json(), "Swap undo");
            return privateJson(
                c,
                await undoMealSwap({
                    userId,
                    changeId: requiredParam(c, "changeId"),
                    expectedVersion: Number(body.expected_version),
                    confirm: body.confirm === true,
                    idempotencyKey: String(body.idempotency_key ?? ""),
                }),
            );
        },
    );

    return app;
}
