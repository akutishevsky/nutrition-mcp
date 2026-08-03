import { Hono } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { safeLocalRedirectPath } from "../accounts/redirect.js";
import { requireWebSession } from "../accounts/session.js";
import {
    createCheckoutForUser,
    createCustomerPortalForUser,
    verifyCheckoutForUser,
} from "./checkout-service.js";
import { verifyStripeWebhookSignature } from "./stripe-webhook.js";
import { processStripeWebhook } from "./webhook-service.js";

export function createBillingRouter(): Hono {
    const billing = new Hono();

    billing.post("/webhooks/stripe", async (c) => {
        const signature = c.req.header("stripe-signature");
        const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!signature || !secret) {
            return c.json({ error: "invalid_webhook_configuration" }, 400);
        }

        const rawPayload = await c.req.text();
        try {
            verifyStripeWebhookSignature(rawPayload, signature, secret);
        } catch {
            return c.json({ error: "invalid_webhook_signature" }, 400);
        }

        try {
            const result = await processStripeWebhook(rawPayload);
            return c.json({ received: true, result });
        } catch {
            console.error("Stripe webhook processing failed");
            return c.json({ error: "webhook_processing_failed" }, 500);
        }
    });

    billing.post(
        "/billing/checkout",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            let returnTo: string | undefined;
            try {
                const body = (await c.req.json()) as { returnTo?: unknown };
                if (typeof body.returnTo === "string") {
                    returnTo = safeLocalRedirectPath(body.returnTo);
                }
            } catch {
                // An empty body is valid for ordinary account checkout.
            }

            const checkout = await createCheckoutForUser({
                userId: c.get("munchUserId"),
                successReturnTo: returnTo,
                cancelReturnTo: returnTo,
            });
            return c.json(checkout);
        },
    );

    billing.get("/billing/success", requireWebSession, async (c) => {
        const sessionId = c.req.query("session_id");
        if (!sessionId) {
            return c.json({ error: "checkout_session_required" }, 400);
        }

        try {
            await verifyCheckoutForUser(c.get("munchUserId"), sessionId);
            return c.redirect(
                safeLocalRedirectPath(c.req.query("return_to")),
                303,
            );
        } catch {
            return c.json({ error: "checkout_verification_failed" }, 400);
        }
    });

    billing.get("/billing/canceled", requireWebSession, (c) =>
        c.redirect(safeLocalRedirectPath(c.req.query("return_to")), 303),
    );

    billing.post(
        "/billing/portal",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            try {
                const portal = await createCustomerPortalForUser(
                    c.get("munchUserId"),
                );
                return c.json(portal);
            } catch {
                return c.json({ error: "billing_portal_unavailable" }, 409);
            }
        },
    );

    return billing;
}
