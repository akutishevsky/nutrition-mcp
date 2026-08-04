import { Hono } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import {
    dissolveHousehold,
    leaveHousehold,
    transferHouseholdOwnership,
} from "./lifecycle.js";
import { getActiveHouseholdContext } from "./repository.js";

function failure(c: any, error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = message.includes("owner required") ? 403 : 400;
    return c.json({ error: message }, status);
}

export function createHouseholdLifecycleRouter(): Hono {
    const router = new Hono();

    router.post(
        "/account/household/transfer",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            try {
                const body = (await c.req.json()) as {
                    membership_id?: unknown;
                    confirm?: unknown;
                };
                if (
                    typeof body.membership_id !== "string" ||
                    body.confirm !== true
                ) {
                    return c.json(
                        { error: "membership_and_confirmation_required" },
                        400,
                    );
                }
                const userId = c.get("munchUserId");
                const household = await getActiveHouseholdContext(userId);
                if (!household || household.role !== "owner") {
                    return c.json({ error: "household_owner_required" }, 403);
                }
                return c.json({
                    transferred: await transferHouseholdOwnership({
                        userId,
                        householdId: household.householdId,
                        targetMembershipId: body.membership_id,
                    }),
                });
            } catch (error) {
                return failure(c, error);
            }
        },
    );

    router.post(
        "/account/household/leave",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            try {
                const body = (await c.req.json()) as { confirm?: unknown };
                if (body.confirm !== true) {
                    return c.json({ error: "confirmation_required" }, 400);
                }
                return c.json({
                    left: await leaveHousehold(c.get("munchUserId")),
                });
            } catch (error) {
                return failure(c, error);
            }
        },
    );

    router.post(
        "/account/household/dissolve",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            try {
                const body = (await c.req.json()) as {
                    confirmation?: unknown;
                };
                if (body.confirmation !== "DISSOLVE HOUSEHOLD") {
                    return c.json(
                        { error: "dissolution_confirmation_required" },
                        400,
                    );
                }
                const userId = c.get("munchUserId");
                const household = await getActiveHouseholdContext(userId);
                if (!household || household.role !== "owner") {
                    return c.json({ error: "household_owner_required" }, 403);
                }
                return c.json({
                    dissolved: await dissolveHousehold({
                        userId,
                        householdId: household.householdId,
                    }),
                });
            } catch (error) {
                return failure(c, error);
            }
        },
    );

    return router;
}
