import { afterEach, describe, expect, mock, test } from "bun:test";
import { sendBetterAuthMagicLink } from "./email.js";

const original = { ...process.env };

afterEach(() => {
    for (const key of Object.keys(process.env)) {
        if (!(key in original)) delete process.env[key];
    }
    Object.assign(process.env, original);
});

function configureDelivery() {
    Object.assign(process.env, {
        NODE_ENV: "production",
        MUNCH_EMAIL_DELIVERY_ENDPOINT: "https://mail.example/deliver",
        MUNCH_EMAIL_DELIVERY_SECRET: "delivery-secret",
        MUNCH_EMAIL_FROM: "Munch <support@munch.example>",
    });
}

describe("Better Auth magic-link delivery", () => {
    test("sends the complete authenticated provider contract", async () => {
        configureDelivery();
        let requestUrl = "";
        let requestInit: RequestInit | undefined;
        const fetchImpl = mock(
            async (input: string | URL | Request, init?: RequestInit) => {
                requestUrl = String(input);
                requestInit = init;
                return new Response(null, { status: 202 });
            },
        ) as unknown as typeof fetch;

        await sendBetterAuthMagicLink(
            {
                email: "person@example.com",
                loginUrl: "https://munch.example/connect/confirm?token=secret",
                expiresAt: new Date("2026-08-04T12:00:00.000Z"),
            },
            fetchImpl,
        );

        expect(requestUrl).toBe("https://mail.example/deliver");
        expect(requestInit?.method).toBe("POST");
        const headers = new Headers(requestInit?.headers);
        expect(headers.get("authorization")).toBe("Bearer delivery-secret");
        expect(headers.get("content-type")).toBe("application/json");
        expect(JSON.parse(String(requestInit?.body))).toEqual({
            email: "person@example.com",
            from: "Munch <support@munch.example>",
            loginUrl: "https://munch.example/connect/confirm?token=secret",
            expiresAt: "2026-08-04T12:00:00.000Z",
            product: "Munch",
            template: "magic-link",
        });
    });

    test("fails closed when the sender identity is missing", async () => {
        configureDelivery();
        delete process.env.MUNCH_EMAIL_FROM;
        const fetchImpl = mock(
            async () => new Response(null, { status: 202 }),
        ) as unknown as typeof fetch;

        await expect(
            sendBetterAuthMagicLink(
                {
                    email: "person@example.com",
                    loginUrl:
                        "https://munch.example/connect/confirm?token=secret",
                    expiresAt: new Date("2026-08-04T12:00:00.000Z"),
                },
                fetchImpl,
            ),
        ).rejects.toThrow("MUNCH_EMAIL_FROM is required");
    });
});
