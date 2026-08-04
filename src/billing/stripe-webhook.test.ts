import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifyStripeWebhookSignature } from "./stripe-webhook.js";

function signatureHeader(payload: string, secret: string, timestamp: number) {
    const signature = createHmac("sha256", secret)
        .update(`${timestamp}.${payload}`, "utf8")
        .digest("hex");
    return `t=${timestamp},v1=${signature}`;
}

describe("Stripe webhook verification", () => {
    const secret = "whsec_test_secret";
    const timestamp = 1_785_779_200;
    const payload = JSON.stringify({
        id: "evt_test",
        type: "customer.updated",
    });

    test("accepts a valid v1 signature", () => {
        const verified = verifyStripeWebhookSignature(
            payload,
            signatureHeader(payload, secret, timestamp),
            secret,
            { nowSeconds: timestamp },
        );

        expect(verified).toEqual({
            timestamp,
            signatureVersion: "v1",
        });
    });

    test("rejects a changed payload", () => {
        expect(() =>
            verifyStripeWebhookSignature(
                `${payload} `,
                signatureHeader(payload, secret, timestamp),
                secret,
                { nowSeconds: timestamp },
            ),
        ).toThrow("signature verification failed");
    });

    test("rejects stale webhook timestamps", () => {
        expect(() =>
            verifyStripeWebhookSignature(
                payload,
                signatureHeader(payload, secret, timestamp),
                secret,
                { nowSeconds: timestamp + 301 },
            ),
        ).toThrow("outside the accepted tolerance");
    });

    test("supports signature rotation headers", () => {
        const valid = signatureHeader(payload, secret, timestamp);
        const header = `${valid},v1=${"0".repeat(64)}`;

        expect(
            verifyStripeWebhookSignature(payload, header, secret, {
                nowSeconds: timestamp,
            }).timestamp,
        ).toBe(timestamp);
    });
});
