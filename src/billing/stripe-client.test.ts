import { afterEach, describe, expect, mock, test } from "bun:test";
import {
    createStripeCheckoutSession,
    createStripePortalSession,
    retrieveStripePrice,
    StripeRequestError,
} from "./stripe-client.js";

const originalFetch = globalThis.fetch;
const originalKey = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
});

function stripeResponse(input: {
    id: string;
    url: string;
    customer: string | null;
}): Response {
    return new Response(
        JSON.stringify({
            id: input.id,
            url: input.url,
            customer: input.customer,
            subscription: null,
            payment_status: "unpaid",
            status: "open",
            client_reference_id: input.customer ? "user-2" : "user-1",
        }),
        {
            status: 200,
            headers: { "content-type": "application/json" },
        },
    );
}

describe("Stripe Checkout", () => {
    test("creates one recurring subscription without a trial", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        let encoded = "";
        globalThis.fetch = mock(async (_url, init) => {
            encoded = String(init?.body ?? "");
            return stripeResponse({
                id: "cs_test_munch",
                url: "https://checkout.stripe.test/session",
                customer: null,
            });
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
        expect(params.has("subscription_data[trial_period_days]")).toBe(false);
        expect(params.get("payment_method_collection")).toBe("always");
        expect(params.get("subscription_data[metadata][munch_user_id]")).toBe(
            "user-1",
        );
    });

    test("uses an existing customer without adding trial settings", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        let encoded = "";
        globalThis.fetch = mock(async (_url, init) => {
            encoded = String(init?.body ?? "");
            return stripeResponse({
                id: "cs_test_returning",
                url: "https://checkout.stripe.test/returning",
                customer: "cus_returning",
            });
        }) as unknown as typeof fetch;

        await createStripeCheckoutSession({
            userId: "user-2",
            customerId: "cus_returning",
            priceId: "price_munch_monthly",
            successUrl: "https://munch.test/success",
            cancelUrl: "https://munch.test/cancel",
        });
        const params = new URLSearchParams(encoded);
        expect(params.get("customer")).toBe("cus_returning");
        expect(params.has("subscription_data[trial_period_days]")).toBe(false);
        expect(params.get("payment_method_collection")).toBe("always");
    });

    test("retrieves the configured recurring price using the app Stripe key", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        let requestedUrl = "";
        globalThis.fetch = mock(async (url) => {
            requestedUrl = String(url);
            return new Response(
                JSON.stringify({
                    id: "price_munch_monthly",
                    active: true,
                    livemode: false,
                    type: "recurring",
                    recurring: { interval: "month", interval_count: 1 },
                }),
                { status: 200 },
            );
        }) as unknown as typeof fetch;

        const price = await retrieveStripePrice("price_munch_monthly");
        expect(requestedUrl.endsWith("/v1/prices/price_munch_monthly")).toBe(
            true,
        );
        expect(price.active).toBe(true);
        expect(price.type).toBe("recurring");
    });

    test("accepts a restricted (rk_) secret key for portal sessions", async () => {
        process.env.STRIPE_SECRET_KEY = "rk_test_munch";
        let authorization = "";
        globalThis.fetch = mock(async (_url, init) => {
            authorization = String(
                (init?.headers as Record<string, string>)?.Authorization ??
                    "",
            );
            return new Response(
                JSON.stringify({
                    id: "bps_test_munch",
                    url: "https://billing.stripe.test/session",
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                },
            );
        }) as unknown as typeof fetch;

        const session = await createStripePortalSession({
            customerId: "cus_munch",
            returnUrl: "https://munch.test/account",
        });
        expect(session.url).toBe("https://billing.stripe.test/session");
        expect(authorization).toBe("Bearer rk_test_munch");
    });

    test("preserves Stripe error details for actionable checkout diagnostics", async () => {
        process.env.STRIPE_SECRET_KEY = "sk_test_munch";
        globalThis.fetch = mock(
            async () =>
                new Response(
                    JSON.stringify({
                        error: {
                            type: "invalid_request_error",
                            code: "resource_missing",
                            message: "No such customer",
                            param: "customer",
                            request_log_url:
                                "https://dashboard.stripe.test/log/request",
                        },
                    }),
                    {
                        status: 404,
                        headers: { "request-id": "req_munch_test" },
                    },
                ),
        ) as unknown as typeof fetch;

        try {
            await retrieveStripePrice("price_missing");
            throw new Error("expected StripeRequestError");
        } catch (error) {
            expect(error).toBeInstanceOf(StripeRequestError);
            const stripeError = error as StripeRequestError;
            expect(stripeError.code).toBe("resource_missing");
            expect(stripeError.status).toBe(404);
            expect(stripeError.stripeMessage).toBe("No such customer");
            expect(stripeError.param).toBe("customer");
            expect(stripeError.requestId).toBe("req_munch_test");
            expect(stripeError.requestLogUrl).toBe(
                "https://dashboard.stripe.test/log/request",
            );
        }
    });
});
