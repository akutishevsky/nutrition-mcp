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
        RESEND_API_KEY: "re_test_key",
        MUNCH_EMAIL_FROM: "Munch <support@munch.example>",
    });
}

const input = {
    email: "person@example.com",
    loginUrl: "https://munch.example/connect/confirm?token=secret",
    expiresAt: new Date("2026-08-04T12:00:00.000Z"),
};

describe("Better Auth magic-link delivery", () => {
    test("sends a branded transactional email through Resend", async () => {
        configureDelivery();
        let requestUrl = "";
        let requestInit: RequestInit | undefined;
        const fetchImpl = mock(
            async (request: string | URL | Request, init?: RequestInit) => {
                requestUrl = String(request);
                requestInit = init;
                return new Response(JSON.stringify({ id: "email_123" }), {
                    status: 200,
                    headers: { "content-type": "application/json" },
                });
            },
        ) as unknown as typeof fetch;

        await sendBetterAuthMagicLink(input, fetchImpl);

        expect(requestUrl).toBe("https://api.resend.com/emails");
        expect(requestInit?.method).toBe("POST");
        const headers = new Headers(requestInit?.headers);
        expect(headers.get("authorization")).toBe("Bearer re_test_key");
        expect(headers.get("content-type")).toBe("application/json");

        const body = JSON.parse(String(requestInit?.body)) as Record<
            string,
            unknown
        >;
        expect(body.from).toBe("Munch <support@munch.example>");
        expect(body.to).toEqual(["person@example.com"]);
        expect(body.subject).toBe("Sign in to Munch");
        expect(String(body.text)).toContain(input.loginUrl);
        expect(String(body.text)).toContain(input.expiresAt.toISOString());
        expect(String(body.html)).toContain(
            "https://munch.example/connect/confirm?token=secret",
        );
        expect(String(body.html)).toContain("Continue signing in");
    });

    test("fails closed when the Resend API key is missing", async () => {
        configureDelivery();
        delete process.env.RESEND_API_KEY;
        const fetchImpl = mock(
            async () => new Response(null, { status: 200 }),
        ) as unknown as typeof fetch;

        await expect(sendBetterAuthMagicLink(input, fetchImpl)).rejects.toThrow(
            "RESEND_API_KEY is required",
        );
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    test("fails closed when the sender identity is missing", async () => {
        configureDelivery();
        delete process.env.MUNCH_EMAIL_FROM;
        const fetchImpl = mock(
            async () => new Response(null, { status: 200 }),
        ) as unknown as typeof fetch;

        await expect(sendBetterAuthMagicLink(input, fetchImpl)).rejects.toThrow(
            "MUNCH_EMAIL_FROM is required",
        );
    });

    test("does not expose Resend response details on failure", async () => {
        configureDelivery();
        const fetchImpl = mock(
            async () =>
                new Response(
                    JSON.stringify({ message: "sensitive provider detail" }),
                    { status: 422 },
                ),
        ) as unknown as typeof fetch;

        await expect(sendBetterAuthMagicLink(input, fetchImpl)).rejects.toThrow(
            "Resend rejected the magic-link email request",
        );
    });
});
