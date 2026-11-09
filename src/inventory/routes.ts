import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import {
    refundAiCredits,
    requireAiCredits,
} from "../billing/android-ai-credits.js";
import {
    resolveRequestMunchCapabilities,
    type MunchCapabilities,
} from "../billing/capabilities.js";
import { generatePantryMealIdeas } from "./meal-ideas.js";
import { getPantryPlanningContext } from "./meal-planning.js";
import {
    enrichPantryItemsBestEffort,
    pantryPlanningEnabled,
} from "./planning-profile.js";
import {
    getPantry,
    getPantryPreference,
    reconcilePantry,
    reconcilePurchase,
    setPantryPreference,
    type InventoryLocation,
    type InventoryScope,
    type PantryOperation,
    type PurchaseLineInput,
} from "./repository.js";
import { previewInventoryImage } from "./vision.js";

function privateJson(c: Context, data: unknown, status = 200) {
    return c.json(data, status as 200, {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
    });
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
    return value as Record<string, unknown>;
}

async function premiumContext(c: Context) {
    const userId = c.get("munchUserId") as string;
    const capabilities = await resolveRequestMunchCapabilities(c, userId);
    if (!capabilities.personalPlanningRead) {
        return { userId, capabilities, premium: false as const };
    }
    return { userId, capabilities, premium: true as const };
}

function scopeFromValue(
    value: unknown,
    capabilities: MunchCapabilities,
    write: boolean,
): InventoryScope {
    const scope = value ?? "personal";
    if (scope === "personal") return { type: "personal" };
    if (scope !== "household")
        throw new Error("Pantry scope must be personal or household");
    if (
        !capabilities.household ||
        (write ? !capabilities.householdWrite : !capabilities.householdRead)
    ) {
        throw new Error("Household Pantry access is unavailable");
    }
    return {
        type: "household",
        householdId: capabilities.household.householdId,
    };
}

function locationValue(value: unknown): InventoryLocation | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (
        value === "pantry" ||
        value === "fridge" ||
        value === "freezer" ||
        value === "unspecified"
    ) {
        return value;
    }
    throw new Error("Invalid Pantry location");
}

function numberValue(
    value: unknown,
    label: string,
    allowZero = false,
): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
        throw new Error(`${label} is invalid`);
    }
    return parsed;
}

function pantryOperations(value: unknown): PantryOperation[] {
    if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
        throw new Error("Pantry operations must contain 1 to 100 items");
    }
    return value.map((raw) => {
        const body = objectValue(raw, "Pantry operation");
        const action = body.action;
        const confidence = numberValue(
            body.confidence,
            "Pantry confidence",
            true,
        );
        if (action === "acquire") {
            if (typeof body.name !== "string" || !body.name.trim())
                throw new Error("Pantry acquisition name is required");
            return {
                action,
                name: body.name,
                quantity: numberValue(body.quantity, "Pantry quantity", true),
                unit: typeof body.unit === "string" ? body.unit : undefined,
                quantityMode:
                    body.quantity_mode === "exact" ||
                    body.quantity_mode === "approximate" ||
                    body.quantity_mode === "presence_only"
                        ? body.quantity_mode
                        : undefined,
                location: locationValue(body.location),
                foodProvider:
                    typeof body.food_provider === "string"
                        ? body.food_provider
                        : undefined,
                providerFoodId:
                    typeof body.provider_food_id === "string"
                        ? body.provider_food_id
                        : undefined,
                barcode:
                    typeof body.barcode === "string" ? body.barcode : undefined,
                note: typeof body.note === "string" ? body.note : undefined,
                confidence,
            };
        }
        const itemId =
            typeof body.inventory_item_id === "string"
                ? body.inventory_item_id
                : "";
        if (!itemId) throw new Error("Pantry inventory_item_id is required");
        if (action === "consume") {
            const quantity = numberValue(
                body.quantity,
                "Pantry consumption quantity",
            );
            if (!quantity)
                throw new Error("Pantry consumption quantity is required");
            return {
                action,
                inventoryItemId: itemId,
                quantity,
                unit: typeof body.unit === "string" ? body.unit : undefined,
                confidence,
            };
        }
        if (
            action === "consume_all" ||
            action === "mark_depleted" ||
            action === "discard" ||
            action === "mark_low"
        ) {
            return { action, inventoryItemId: itemId, confidence };
        }
        if (action === "move") {
            const location = locationValue(body.location);
            if (!location) throw new Error("Pantry move location is required");
            return { action, inventoryItemId: itemId, location, confidence };
        }
        if (action === "correct") {
            return {
                action,
                inventoryItemId: itemId,
                quantity:
                    body.quantity === null
                        ? null
                        : numberValue(
                              body.quantity,
                              "Pantry correction quantity",
                              true,
                          ),
                unit:
                    body.unit === null
                        ? null
                        : typeof body.unit === "string"
                          ? body.unit
                          : undefined,
                quantityMode:
                    body.quantity_mode === "exact" ||
                    body.quantity_mode === "approximate" ||
                    body.quantity_mode === "presence_only"
                        ? body.quantity_mode
                        : undefined,
                stockState:
                    body.stock_state === "available" ||
                    body.stock_state === "low" ||
                    body.stock_state === "depleted"
                        ? body.stock_state
                        : undefined,
                note:
                    body.note === null
                        ? null
                        : typeof body.note === "string"
                          ? body.note
                          : undefined,
                confidence,
            };
        }
        throw new Error("Unsupported Pantry operation");
    });
}

function purchaseLines(value: unknown): PurchaseLineInput[] {
    if (!Array.isArray(value) || value.length < 1 || value.length > 200) {
        throw new Error("Purchase lines must contain 1 to 200 items");
    }
    return value.map((raw) => {
        const body = objectValue(raw, "Purchase line");
        if (typeof body.name !== "string" || !body.name.trim())
            throw new Error("Purchase line name is required");
        return {
            rawLabel:
                typeof body.raw_label === "string" ? body.raw_label : undefined,
            name: body.name,
            quantity: numberValue(body.quantity, "Purchase quantity"),
            unit: typeof body.unit === "string" ? body.unit : undefined,
            foodProvider:
                typeof body.food_provider === "string"
                    ? body.food_provider
                    : undefined,
            providerFoodId:
                typeof body.provider_food_id === "string"
                    ? body.provider_food_id
                    : undefined,
            confidence: numberValue(
                body.confidence,
                "Purchase confidence",
                true,
            ),
            isFood:
                typeof body.is_food === "boolean" ? body.is_food : undefined,
            confirmed: body.confirmed === true,
            location: locationValue(body.location),
        };
    });
}

export function createInventoryRouter(): Hono {
    const app = new Hono();

    app.get("/app/pantry", async (c) =>
        c.html(await Bun.file("./public/pantry.html").text(), 200, {
            "Cache-Control": "no-store, private",
        }),
    );
    app.get("/pantry.js", async (c) =>
        c.body(await Bun.file("./public/pantry.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/pantry.css", async (c) =>
        c.body(await Bun.file("./public/pantry.css").text(), 200, {
            "Content-Type": "text/css; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );

    app.use("/api/app/pantry", requireWebSession);
    app.use("/api/app/pantry/*", requireWebSession);
    app.use("/api/app/purchases/*", requireWebSession);

    app.get("/api/app/pantry/settings", async (c) => {
        const context = await premiumContext(c);
        if (!context.premium)
            return privateJson(c, { premium: false, enabled: false }, 403);
        return privateJson(c, {
            premium: true,
            enabled: await getPantryPreference(context.userId),
            household_available: Boolean(context.capabilities.householdRead),
        });
    });

    app.patch("/api/app/pantry/settings", requireSameOrigin, async (c) => {
        const context = await premiumContext(c);
        if (!context.premium)
            return privateJson(c, { error: "premium_required" }, 403);
        const body = objectValue(await c.req.json(), "Pantry settings");
        if (typeof body.enabled !== "boolean")
            throw new Error("Pantry enabled must be boolean");
        return privateJson(c, {
            premium: true,
            enabled: await setPantryPreference({
                userId: context.userId,
                enabled: body.enabled,
            }),
        });
    });

    app.get("/api/app/pantry", async (c) => {
        const context = await premiumContext(c);
        if (!context.premium)
            return privateJson(c, { error: "premium_required" }, 403);
        const scope = scopeFromValue(
            c.req.query("scope"),
            context.capabilities,
            false,
        );
        const candidates = (c.req.query("candidates") ?? "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 30);
        const detailLevel = c.req.query("detail_level") ?? "basic";
        if (detailLevel !== "basic" && detailLevel !== "planning") {
            throw new Error("Invalid Pantry detail level");
        }
        const pantry =
            detailLevel === "planning" && pantryPlanningEnabled()
                ? await getPantryPlanningContext({
                      userId: context.userId,
                      scope,
                      query: c.req.query("q"),
                      location: locationValue(c.req.query("location")),
                      limit: 200,
                  })
                : await getPantry({
                      userId: context.userId,
                      scope,
                      query: c.req.query("q"),
                      candidateNames: candidates,
                      location: locationValue(c.req.query("location")),
                      includeDepleted:
                          c.req.query("include_depleted") === "true",
                  });
        return privateJson(c, pantry);
    });

    app.post("/api/app/pantry/reconcile", requireSameOrigin, async (c) => {
        const context = await premiumContext(c);
        if (!context.premium)
            return privateJson(c, { error: "premium_required" }, 403);
        const body = objectValue(await c.req.json(), "Pantry reconciliation");
        const sourceType = body.source_type;
        if (
            sourceType !== "manual" &&
            sourceType !== "pantry_scan" &&
            sourceType !== "meal_reconciliation" &&
            sourceType !== "recipe_preparation" &&
            sourceType !== "correction"
        ) {
            throw new Error("Invalid Pantry source type");
        }
        if (typeof body.idempotency_key !== "string")
            throw new Error("Pantry idempotency key is required");
        const result = await reconcilePantry({
            userId: context.userId,
            scope: scopeFromValue(body.scope, context.capabilities, true),
            sourceType,
            sourceEntityId:
                typeof body.source_entity_id === "string"
                    ? body.source_entity_id
                    : undefined,
            idempotencyKey: body.idempotency_key,
            operations: pantryOperations(body.operations),
        });
        if (pantryPlanningEnabled()) {
            await enrichPantryItemsBestEffort({
                userId: context.userId,
                inventoryItemIds: result.operations.map(
                    (operation) => operation.item.id,
                ),
                limit: 16,
            });
        }
        return privateJson(c, result);
    });

    app.post("/api/app/purchases/reconcile", requireSameOrigin, async (c) => {
        const context = await premiumContext(c);
        if (!context.premium)
            return privateJson(c, { error: "premium_required" }, 403);
        const body = objectValue(await c.req.json(), "Purchase reconciliation");
        if (typeof body.idempotency_key !== "string")
            throw new Error("Purchase idempotency key is required");
        const result = await reconcilePurchase({
            userId: context.userId,
            scope: scopeFromValue(body.scope, context.capabilities, true),
            idempotencyKey: body.idempotency_key,
            sourceLabel:
                typeof body.source_label === "string"
                    ? body.source_label
                    : undefined,
            purchasedAt:
                typeof body.purchased_at === "string"
                    ? body.purchased_at
                    : undefined,
            lines: purchaseLines(body.lines),
        });
        if (pantryPlanningEnabled()) {
            await enrichPantryItemsBestEffort({
                userId: context.userId,
                inventoryItemIds: result.lines
                    .map((line) => line.inventory_item_id)
                    .filter((id): id is string => Boolean(id)),
                limit: 24,
            });
        }
        return privateJson(c, result);
    });

    app.post("/api/app/pantry/meal-ideas", requireSameOrigin, async (c) => {
        const context = await premiumContext(c);
        if (!(await getPantryPreference(context.userId)))
            return privateJson(c, { error: "pantry_not_enabled" }, 409);
        if (!pantryPlanningEnabled())
            return privateJson(c, { error: "pantry_planning_disabled" }, 503);
        const body = objectValue(await c.req.json(), "Pantry meal ideas");
        const goal = body.goal ?? "balanced";
        if (
            goal !== "high_protein" &&
            goal !== "low_calorie" &&
            goal !== "high_fiber" &&
            goal !== "use_what_i_have" &&
            goal !== "balanced"
        ) {
            throw new Error("Invalid Pantry meal goal");
        }
        const mealType = body.meal_type ?? "dinner";
        if (
            mealType !== "breakfast" &&
            mealType !== "lunch" &&
            mealType !== "dinner" &&
            mealType !== "snack"
        ) {
            throw new Error("Invalid meal type");
        }
        const assumedStaples = Array.isArray(body.assumed_staples)
            ? body.assumed_staples
                  .filter((value): value is string => typeof value === "string")
                  .map((value) => value.trim())
                  .filter(Boolean)
                  .slice(0, 20)
            : [];
        const scope = scopeFromValue(body.scope, context.capabilities, false);
        // One credit meter for web + app (brief §2, Decision 3): reserve
        // before the model call; refund if generation fails.
        const gate = await requireAiCredits(c, {
            userId: context.userId,
            task: "meal_ideas",
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : undefined,
        });
        if (!gate.allowed) return gate.response;
        let generated: Awaited<ReturnType<typeof generatePantryMealIdeas>>;
        try {
            generated = await generatePantryMealIdeas({
                userId: context.userId,
                scope,
                goal,
                mealType,
                servings: numberValue(body.servings, "Servings"),
                maxMinutes: numberValue(body.max_minutes, "Maximum minutes"),
                allowMissingItems:
                    body.allow_missing_items === undefined
                        ? 1
                        : numberValue(
                              body.allow_missing_items,
                              "Allowed missing items",
                              true,
                          ),
                assumedStaples,
            });
        } catch (error) {
            await refundAiCredits(gate.reservation);
            throw error;
        }
        return privateJson(c, {
            result: generated.result,
            context_summary: {
                pantry_items: generated.context.pantry.length,
                saved_recipe_candidates:
                    generated.context.saved_recipe_candidates.length,
                enrichment: generated.context.pantry_enrichment,
            },
        });
    });

    async function imagePreview(c: Context, mode: "receipt" | "pantry_photo") {
        const context = await premiumContext(c);
        if (!(await getPantryPreference(context.userId)))
            return privateJson(c, { error: "pantry_not_enabled" }, 409);
        const form = await c.req.parseBody();
        const uploaded = form.file;
        if (
            !uploaded ||
            typeof uploaded !== "object" ||
            typeof (uploaded as File).arrayBuffer !== "function"
        ) {
            throw new Error("Image file is required");
        }
        const file = uploaded as File;
        if (file.size > 8 * 1024 * 1024)
            throw new Error("Image exceeds the 8 MB Pantry limit");
        // Reserve before the vision call; refund on failure (brief §2).
        const gate = await requireAiCredits(c, {
            userId: context.userId,
            task: mode === "receipt" ? "receipt_scan" : "pantry_photo_scan",
        });
        if (!gate.allowed) return gate.response;
        let preview: Awaited<ReturnType<typeof previewInventoryImage>>;
        try {
            preview = await previewInventoryImage({
                mode,
                mimeType: file.type,
                bytes: new Uint8Array(await file.arrayBuffer()),
            });
        } catch (error) {
            await refundAiCredits(gate.reservation);
            throw error;
        }
        return privateJson(c, {
            file_name: file.name.slice(0, 200),
            transient_media: true,
            preview,
        });
    }

    app.post("/api/app/purchases/receipt-preview", requireSameOrigin, (c) =>
        imagePreview(c, "receipt"),
    );
    app.post("/api/app/pantry/scan-preview", requireSameOrigin, (c) =>
        imagePreview(c, "pantry_photo"),
    );

    return app;
}
