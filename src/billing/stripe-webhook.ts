import { createHmac, timingSafeEqual } from "node:crypto";

export interface StripeSignatureVerificationOptions {
    nowSeconds?: number;
    toleranceSeconds?: number;
}

export interface VerifiedStripeSignature {
    timestamp: number;
    signatureVersion: "v1";
}

interface ParsedSignatureHeader {
    timestamp: number;
    signatures: string[];
}

function parseSignatureHeader(header: string): ParsedSignatureHeader {
    const values = header.split(",").map((part) => part.trim());
    let timestamp: number | undefined;
    const signatures: string[] = [];

    for (const value of values) {
        const separator = value.indexOf("=");
        if (separator <= 0) continue;
        const key = value.slice(0, separator);
        const entry = value.slice(separator + 1);
        if (key === "t") {
            const parsed = Number(entry);
            if (Number.isSafeInteger(parsed) && parsed > 0) {
                timestamp = parsed;
            }
        } else if (key === "v1" && /^[a-f0-9]{64}$/i.test(entry)) {
            signatures.push(entry.toLowerCase());
        }
    }

    if (!timestamp || signatures.length === 0) {
        throw new Error("Invalid Stripe-Signature header");
    }

    return { timestamp, signatures };
}

function constantTimeHexMatch(actualHex: string, expectedHex: string): boolean {
    const actual = Buffer.from(actualHex, "hex");
    const expected = Buffer.from(expectedHex, "hex");
    return (
        actual.length === expected.length && timingSafeEqual(actual, expected)
    );
}

export function verifyStripeWebhookSignature(
    rawPayload: string | Uint8Array,
    signatureHeader: string,
    endpointSecret: string,
    options: StripeSignatureVerificationOptions = {},
): VerifiedStripeSignature {
    if (!endpointSecret.startsWith("whsec_")) {
        throw new Error("Stripe webhook secret must start with whsec_");
    }

    const parsed = parseSignatureHeader(signatureHeader);
    const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
    const toleranceSeconds = options.toleranceSeconds ?? 300;

    if (
        !Number.isFinite(toleranceSeconds) ||
        toleranceSeconds < 0 ||
        toleranceSeconds > 3600
    ) {
        throw new Error(
            "Stripe signature tolerance must be between 0 and 3600 seconds",
        );
    }

    if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
        throw new Error(
            "Stripe webhook timestamp is outside the accepted tolerance",
        );
    }

    const body =
        typeof rawPayload === "string"
            ? rawPayload
            : Buffer.from(rawPayload).toString("utf8");
    const signedPayload = `${parsed.timestamp}.${body}`;
    const expected = createHmac("sha256", endpointSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

    const valid = parsed.signatures.some((signature) =>
        constantTimeHexMatch(signature, expected),
    );
    if (!valid) {
        throw new Error("Stripe webhook signature verification failed");
    }

    return {
        timestamp: parsed.timestamp,
        signatureVersion: "v1",
    };
}
