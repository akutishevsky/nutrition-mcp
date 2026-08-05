import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import {
    listOAuthConnections,
    revokeOAuthConnection,
} from "../portal/repository.js";
import {
    deleteMeal,
    deleteWater,
    deleteWeight,
    getNutritionGoals,
    insertWater,
    insertWeight,
    updateMeal,
    upsertNutritionGoals,
    upsertProfile,
} from "../storage.js";
import { validateTz } from "../tz.js";
import { isPlausibleWeightGrams, isWeightUnit, toGrams } from "../units.js";
import {
    getAppBootstrap,
    getFoodsWorkspace,
    getHouseholdWorkspace,
    getInsightsWorkspace,
    getMealHistoryWorkspace,
    getPlanningWorkspace,
    getTodayWorkspace,
} from "./repository.js";

function requiredQuery(value: string | undefined, name: string): string {
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function numberOrNull(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Invalid number");
    }
    return parsed;
}

function privateJson(c: Context, data: unknown) {
    return c.json(data, 200, {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
    });
}

function mealType(value: unknown) {
    if (
        value === "breakfast" ||
        value === "lunch" ||
        value === "dinner" ||
        value === "snack"
    ) {
        return value;
    }
    throw new Error("Invalid meal type");
}

export function createAppRouter(): Hono {
    const app = new Hono();

    app.get("/app.js", async (c) =>
        c.body(await Bun.file("./public/app.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/app", async (c) =>
        c.html(await Bun.file("./public/app.html").text(), 200, {
            "Cache-Control": "no-store, private",
        }),
    );
    app.get("/app/*", async (c) =>
        c.html(await Bun.file("./public/app.html").text(), 200, {
            "Cache-Control": "no-store, private",
        }),
    );

    app.use("/api/app/*", requireWebSession);

    app.get("/api/app/bootstrap", async (c) =>
        privateJson(
            c,
            await getAppBootstrap(
                c.get("munchUserId"),
                c.get("munchUserEmail"),
            ),
        ),
    );

    app.get("/api/app/today", async (c) =>
        privateJson(
            c,
            await getTodayWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("date"), "date"),
            ),
        ),
    );

    app.get("/api/app/meals", async (c) =>
        privateJson(
            c,
            await getMealHistoryWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    app.get("/api/app/foods", async (c) =>
        privateJson(c, await getFoodsWorkspace(c.get("munchUserId"))),
    );

    app.get("/api/app/insights", async (c) =>
        privateJson(
            c,
            await getInsightsWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    app.get("/api/app/planning", async (c) =>
        privateJson(
            c,
            await getPlanningWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    app.get("/api/app/household", async (c) =>
        privateJson(c, await getHouseholdWorkspace(c.get("munchUserId"))),
    );

    app.get("/api/app/settings", async (c) => {
        const userId = c.get("munchUserId");
        const [bootstrap, goals, subscription, connections] = await Promise.all(
            [
                getAppBootstrap(userId, c.get("munchUserEmail")),
                getNutritionGoals(userId),
                getSubscriptionSnapshot(userId),
                listOAuthConnections(userId),
            ],
        );
        return privateJson(c, {
            ...bootstrap,
            goals,
            subscription,
            connections,
        });
    });

    app.patch("/api/app/meals/:id", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const meal = await updateMeal(
            c.get("munchUserId"),
            c.req.param("id")!,
            {
                ...(typeof body.description === "string"
                    ? { description: body.description }
                    : {}),
                ...(body.meal_type !== undefined
                    ? { meal_type: mealType(body.meal_type) }
                    : {}),
                ...(body.calories !== undefined
                    ? {
                          calories: numberOrNull(body.calories) ?? undefined,
                      }
                    : {}),
                ...(body.protein_g !== undefined
                    ? {
                          protein_g: numberOrNull(body.protein_g) ?? undefined,
                      }
                    : {}),
                ...(body.carbs_g !== undefined
                    ? {
                          carbs_g: numberOrNull(body.carbs_g) ?? undefined,
                      }
                    : {}),
                ...(body.fat_g !== undefined
                    ? { fat_g: numberOrNull(body.fat_g) ?? undefined }
                    : {}),
                ...(body.fiber_g !== undefined
                    ? {
                          fiber_g: numberOrNull(body.fiber_g) ?? undefined,
                      }
                    : {}),
                ...(body.sugar_g !== undefined
                    ? {
                          sugar_g: numberOrNull(body.sugar_g) ?? undefined,
                      }
                    : {}),
                ...(body.alcohol_g !== undefined
                    ? {
                          alcohol_g: numberOrNull(body.alcohol_g) ?? undefined,
                      }
                    : {}),
                ...(typeof body.logged_at === "string"
                    ? { logged_at: body.logged_at }
                    : {}),
                ...(body.notes === null || typeof body.notes === "string"
                    ? { notes: body.notes as string | null }
                    : {}),
            },
        );
        return privateJson(c, { meal });
    });

    app.delete("/api/app/meals/:id", requireSameOrigin, async (c) => {
        await deleteMeal(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.post("/api/app/water", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const amountMl = Number(body.amount_ml);
        if (!Number.isInteger(amountMl) || amountMl <= 0 || amountMl > 20_000) {
            throw new Error("Invalid water amount");
        }
        const result = await insertWater(c.get("munchUserId"), {
            amount_ml: amountMl,
            ...(typeof body.logged_at === "string"
                ? { logged_at: body.logged_at }
                : {}),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
        });
        return privateJson(c, result);
    });

    app.delete("/api/app/water/:id", requireSameOrigin, async (c) => {
        await deleteWater(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.post("/api/app/weight", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const value = Number(body.weight);
        if (!Number.isFinite(value) || value <= 0 || !isWeightUnit(body.unit)) {
            throw new Error("Invalid weight");
        }
        const weightG = toGrams(value, body.unit);
        if (!isPlausibleWeightGrams(weightG)) {
            throw new Error("Weight is outside the supported range");
        }
        const result = await insertWeight(c.get("munchUserId"), {
            weight_g: weightG,
            ...(typeof body.logged_at === "string"
                ? { logged_at: body.logged_at }
                : {}),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
        });
        return privateJson(c, result);
    });

    app.delete("/api/app/weight/:id", requireSameOrigin, async (c) => {
        await deleteWeight(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.put("/api/app/goals", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const unit = isWeightUnit(body.unit) ? body.unit : null;
        const targetWeight = numberOrNull(body.target_weight);
        if (targetWeight !== undefined && targetWeight !== null && !unit) {
            throw new Error("Weight unit is required");
        }
        const targetWeightG =
            targetWeight == null || unit == null
                ? targetWeight
                : toGrams(targetWeight, unit);
        if (
            typeof targetWeightG === "number" &&
            !isPlausibleWeightGrams(targetWeightG)
        ) {
            throw new Error("Target weight is outside the supported range");
        }
        const goals = await upsertNutritionGoals(c.get("munchUserId"), {
            daily_calories: numberOrNull(body.daily_calories),
            daily_protein_g: numberOrNull(body.daily_protein_g),
            daily_carbs_g: numberOrNull(body.daily_carbs_g),
            daily_fat_g: numberOrNull(body.daily_fat_g),
            daily_fiber_g: numberOrNull(body.daily_fiber_g),
            daily_sugar_g: numberOrNull(body.daily_sugar_g),
            daily_alcohol_g: numberOrNull(body.daily_alcohol_g),
            daily_water_ml: numberOrNull(body.daily_water_ml),
            target_weight_g: targetWeightG,
        });
        return privateJson(c, { goals });
    });

    app.put("/api/app/preferences", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const patch: Parameters<typeof upsertProfile>[1] = {};
        if (typeof body.timezone === "string") {
            if (!validateTz(body.timezone)) {
                throw new Error("Invalid timezone");
            }
            patch.timezone = body.timezone;
        }
        if (
            body.preferred_weight_unit === null ||
            isWeightUnit(body.preferred_weight_unit)
        ) {
            patch.preferred_weight_unit = body.preferred_weight_unit;
        }
        if (typeof body.widgets_enabled === "boolean") {
            patch.widgets_enabled = body.widgets_enabled;
        }
        if (typeof body.alcohol_tracking_enabled === "boolean") {
            patch.alcohol_tracking_enabled = body.alcohol_tracking_enabled;
        }
        if (
            body.preferred_drink_unit === null ||
            body.preferred_drink_unit === "us" ||
            body.preferred_drink_unit === "uk"
        ) {
            patch.preferred_drink_unit = body.preferred_drink_unit;
        }
        const profile = await upsertProfile(c.get("munchUserId"), patch);
        return privateJson(c, { profile });
    });

    app.delete(
        "/api/app/connections/:tokenFamilyId",
        requireSameOrigin,
        async (c) => {
            const revoked = await revokeOAuthConnection(
                c.get("munchUserId"),
                c.req.param("tokenFamilyId")!,
            );
            if (!revoked) throw new Error("Connection not found");
            return privateJson(c, { revoked: true });
        },
    );

    app.onError((error, c) => {
        console.error("App route failed", { name: error.name });
        const knownMessage =
            error instanceof Error &&
            /^(Invalid|Connection not found|Date range|Weight|Target weight)/.test(
                error.message,
            )
                ? error.message
                : "The request could not be completed.";
        const status: 400 | 404 = knownMessage.includes("not found")
            ? 404
            : 400;
        return c.json(
            { error: "app_request_failed", message: knownMessage },
            status,
            { "Cache-Control": "no-store, private" },
        );
    });

    return app;
}
