import { afterEach, describe, expect, mock, test } from "bun:test";
import {
    sendBetterAuthMagicLink,
    sendBetterAuthPasswordReset,
    sendBetterAuthVerificationEmail,
} from "./email.js";

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

describe("Better Auth password email delivery", () => {
    test("sends verification links through the configured Resend sender", async () => {
        configureDelivery();
        let requestInit: RequestInit | undefined;
        const fetchImpl = mock(
            async (_request: string | URL | Request, init?: RequestInit) => {
                requestInit = init;
                return new Response(JSON.stringify({ id: "email_456" }), {
                    status: 200,
                });
            },
        ) as unknown as typeof fetch;

        await sendBetterAuthVerificationEmail(
            {
                email: "person@example.com",
                verificationUrl:
                    "https://munch.example/account/password?verified=1&token=secret",
            },
            fetchImpl,
        );

        const body = JSON.parse(String(requestInit?.body)) as Record<
            string,
            unknown
        >;
        expect(body.subject).toBe("Verify your Munch email");
        expect(String(body.text)).toContain("token=secret");
        expect(String(body.html)).toContain("Verify email address");
    });

    test("sends password-reset links through the configured Resend sender", async () => {
        configureDelivery();
        let requestInit: RequestInit | undefined;
        const fetchImpl = mock(
            async (_request: string | URL | Request, init?: RequestInit) => {
                requestInit = init;
                return new Response(JSON.stringify({ id: "email_789" }), {
                    status: 200,
                });
            },
        ) as unknown as typeof fetch;

        await sendBetterAuthPasswordReset(
            {
                email: "person@example.com",
                resetUrl:
                    "https://munch.example/account/password/reset?token=secret",
            },
            fetchImpl,
        );

        const body = JSON.parse(String(requestInit?.body)) as Record<
            string,
            unknown
        >;
        expect(body.subject).toBe("Reset your Munch password");
        expect(String(body.text)).toContain("token=secret");
        expect(String(body.html)).toContain("Reset password");
    });
});

describe("Editorial Serif email theme (Amendment F, email scope)", () => {
    async function capture(
        send: (fetchImpl: typeof fetch) => Promise<void>,
    ): Promise<Record<string, unknown>> {
        configureDelivery();
        let requestInit: RequestInit | undefined;
        const fetchImpl = mock(
            async (_request: string | URL | Request, init?: RequestInit) => {
                requestInit = init;
                return new Response(JSON.stringify({ id: "email_theme" }), {
                    status: 200,
                });
            },
        ) as unknown as typeof fetch;
        await send(fetchImpl);
        return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
    }

    function expectThemed(body: Record<string, unknown>) {
        const html = String(body.html);
        // Serif display type on the title, paper ground + card, brand
        // green action, hairline rules, hosted apple mark with alt text.
        expect(html).toContain(
            "font-family: Georgia, 'Times New Roman', Times, serif",
        );
        expect(html).toContain("#f6f1e7");
        expect(html).toContain("#fffdf8");
        expect(html).toContain("#176b3a");
        expect(html).toContain("#0b3d24");
        expect(html).toContain("#d8cdb6");
        expect(html).toContain(
            'src="https://munch.business/brand/munch-mark-192.png"',
        );
        expect(html).toContain('alt="Munch"');
        // Table layout only; no external CSS or custom properties.
        expect(html).toContain('role="presentation"');
        expect(html).not.toContain("<link");
        expect(html).not.toContain("var(--");
        // The retired Arial/white-card theme is gone.
        expect(html).not.toContain("#f4f7f3");
        expect(html).not.toContain("#2f7d4a");
        expect(html).not.toContain("#173d25");
        expect(html).not.toContain("border-radius: 18px");
        // Plain-text part stays in step with the HTML part.
        expect(String(body.text)).toContain(
            "If you did not request this email, you can ignore it.",
        );
        expect(String(body.html)).toContain(
            "If you did not request this email, you can ignore it.",
        );
    }

    test("magic-link email is themed and keeps its link and expiry", async () => {
        const body = await capture((fetchImpl) =>
            sendBetterAuthMagicLink(input, fetchImpl),
        );
        expectThemed(body);
        expect(String(body.html)).toContain(input.loginUrl);
        expect(String(body.text)).toContain(input.loginUrl);
        expect(String(body.html)).toContain(input.expiresAt.toISOString());
        expect(String(body.text)).toContain(input.expiresAt.toISOString());
    });

    test("verification email is themed", async () => {
        const body = await capture((fetchImpl) =>
            sendBetterAuthVerificationEmail(
                {
                    email: "person@example.com",
                    verificationUrl:
                        "https://munch.example/account/password?verified=1",
                },
                fetchImpl,
            ),
        );
        expectThemed(body);
        expect(String(body.html)).toContain("Verify email address");
    });

    test("password-reset email is themed", async () => {
        const body = await capture((fetchImpl) =>
            sendBetterAuthPasswordReset(
                {
                    email: "person@example.com",
                    resetUrl: "https://munch.example/account/password/reset",
                },
                fetchImpl,
            ),
        );
        expectThemed(body);
        expect(String(body.html)).toContain("Reset password");
    });
});
