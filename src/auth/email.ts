interface MagicLinkDeliveryInput {
    email: string;
    loginUrl: string;
    expiresAt: Date;
}

function deliveryEndpoint(): URL {
    const value =
        process.env.MUNCH_EMAIL_DELIVERY_ENDPOINT?.trim() ||
        process.env.MUNCH_LOGIN_DELIVERY_ENDPOINT?.trim();
    if (!value) {
        throw new Error("MUNCH_EMAIL_DELIVERY_ENDPOINT is required");
    }

    const endpoint = new URL(value);
    if (
        process.env.NODE_ENV === "production" &&
        endpoint.protocol !== "https:"
    ) {
        throw new Error(
            "MUNCH_EMAIL_DELIVERY_ENDPOINT must use HTTPS in production",
        );
    }
    return endpoint;
}

function deliverySecret(): string {
    const value =
        process.env.MUNCH_EMAIL_DELIVERY_SECRET?.trim() ||
        process.env.MUNCH_LOGIN_DELIVERY_SECRET?.trim();
    if (!value) throw new Error("MUNCH_EMAIL_DELIVERY_SECRET is required");
    return value;
}

function deliveryFrom(): string {
    const value = process.env.MUNCH_EMAIL_FROM?.trim();
    if (!value) throw new Error("MUNCH_EMAIL_FROM is required");
    return value;
}

export async function sendBetterAuthMagicLink(
    input: MagicLinkDeliveryInput,
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    const response = await fetchImpl(deliveryEndpoint(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${deliverySecret()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: input.email,
            from: deliveryFrom(),
            loginUrl: input.loginUrl,
            expiresAt: input.expiresAt.toISOString(),
            product: "Munch",
            template: "magic-link",
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error("Magic-link delivery provider rejected the request");
    }
}
