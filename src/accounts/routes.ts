import { Hono } from "hono";
import { createAccountExportRouter } from "../account-export-routes.js";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { createHouseholdLifecycleRouter } from "../households/lifecycle-routes.js";
import { createHouseholdRouter } from "../households/routes.js";
import { createAccountLifecycleRouter } from "./lifecycle-routes.js";
import { requireSameOrigin } from "./csrf.js";
import { safeLocalRedirectPath } from "./redirect.js";
import { clearWebSession, requireWebSession } from "./session.js";

export function createAccountRouter(): Hono {
    const account = new Hono();

    account.get("/account/login", (c) => {
        const returnTo = safeLocalRedirectPath(
            c.req.query("return_to"),
            "/app",
        );
        return c.redirect(
            `/connect/sign-in?return_to=${encodeURIComponent(returnTo)}`,
            302,
        );
    });

    // The retired portal landing. Sign-in defaults pointed here long
    // after the app shell replaced the portal, and magic-link emails
    // already in inboxes still carry it as their return target, so the
    // path itself resolves to the signed-in home instead of the 404
    // those arrivals used to meet.
    account.get("/account/portal", (c) => c.redirect("/app", 302));

    account.get("/account", requireWebSession, async (c) => {
        const userId = c.get("munchUserId");
        const subscription = await getSubscriptionSnapshot(userId);
        const entitlement = decideEntitlement(subscription);

        return c.json({
            user: {
                id: userId,
                email: c.get("munchUserEmail"),
            },
            subscription,
            entitlement,
            settingsUrl: "/app/settings",
            mealHistoryUrl: "/app/log",
        });
    });

    account.post(
        "/account/logout",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            await clearWebSession(c);
            return c.json({ signedOut: true });
        },
    );

    account.route("/", createAccountExportRouter());
    account.route("/", createAccountLifecycleRouter());
    account.route("/", createHouseholdRouter());
    account.route("/", createHouseholdLifecycleRouter());
    return account;
}
