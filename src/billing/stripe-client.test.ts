import { afterEach, describe, expect, mock, test } from "bun:test";
import { createStripeCheckoutSession } from "./stripe-client.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
});

describe("Stripe Checkout", () => {
    test("creates one recurring subscription with a 30-day trial", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        let encoded = "";
        globalThis.fetch = mock(async (_url, init) => {
            encoded = String(init?.body ?? "");
            return new Response(
                JSON.stringify({
                    id: "cs_test_munch",
                    url: "https://checkout.stripe.test/session",
                    customer: null,
                    subscription: null,
                    payment_status: "unpaid",
                    status: "open",
                    client_reference_id: "user-1",
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                },
            );
        }) as unknown as typeof fetch;

        await createStripeCheckoutSession({
            userId: "user-1",
            customerEmail: "person@example.com",
            priceId: "price_munch_monthly",
            successUrl: "https://munch.test/success",
            cancelUrl: "https://munch.test/cancel",
        });
        const params = new URLSearchParams(encoded);
        expect(params.get("mode")).toBe("subscription");
        expect(params.get("line_items[0][quantity]")).toBe("1");
        expect(params.get("subscription_data[trial_period_days]")).toBe("30");
        expect(params.get("payment_method_collection")).toBe("always");
        expect(params.get("subscription_data[metadata][munch_user_id]")).toBe(
            "user-1",
        );
    });

    test("omits a repeat trial for an account that subscribed before", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        let encoded = "";
        globalThis.fetch = mock(async (_url, init) => {
            encoded = String(init?.body ?? "");
            return new Response(
                JSON.stringify({
                    id: "cs_test_returning",
                    url: "https://checkout.stripe.test/returning",
                    customer: "cus_returning",
                    subscription: null,
                    payment_status: "unpaid",
                    status: "open",
                    client_reference_id: "user-2",
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                },
            );
        }) as unknown as typeof fetch;

        await createStripeCheckoutSession({
            userId: "user-2",
            customerId: "cus_returning",
            priceId: "price_munch_monthly",
            successUrl: "https://munch.test/success",
            cancelUrl: "https://munch.test/cancel",
            trialDays: null,
        });
        const params = new URLSearchParams(encoded);
        expect(params.has("subscription_data[trial_period_days]")).toBe(false);
        expect(params.get("payment_method_collection")).toBe("always");
    });
});
