import { afterEach, describe, expect, mock, test } from "bun:test";
import { sendHouseholdInvitation } from "./email.js";

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
    email: "guest@example.com",
    householdName: "The Murphy Kitchen",
    invitedByDisplayName: "Dani",
    acceptUrl: "https://munch.example/households/accept?token=abc123",
    expiresAt: "2026-08-11T12:00:00.000Z",
    androidFreeAccess: false,
};

async function capture(
    overrides: Partial<typeof input> = {},
): Promise<Record<string, unknown>> {
    configureDelivery();
    let requestInit: RequestInit | undefined;
    const fetchImpl = mock(
        async (_request: string | URL | Request, init?: RequestInit) => {
            requestInit = init;
            return new Response(JSON.stringify({ id: "email_household" }), {
                status: 200,
            });
        },
    ) as unknown as typeof fetch;
    await sendHouseholdInvitation({ ...input, ...overrides }, fetchImpl);
    return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
}

describe("Household invitation email", () => {
    test("sends through Resend with the invitation facts intact", async () => {
        const body = await capture();
        expect(body.to).toEqual(["guest@example.com"]);
        expect(body.subject).toBe("Dani invited you to a Munch household");
        expect(String(body.text)).toContain(input.acceptUrl);
        expect(String(body.text)).toContain(
            `The invitation expires at ${input.expiresAt}.`,
        );
        expect(String(body.html)).toContain(input.acceptUrl);
        expect(String(body.html)).toContain("Accept invitation");
        expect(String(body.html)).toContain("Join The Murphy Kitchen");
    });

    test("carries the Editorial Serif theme (Amendment F, email scope)", async () => {
        const html = String((await capture()).html);
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
        expect(html).toContain('role="presentation"');
        expect(html).not.toContain("<link");
        expect(html).not.toContain("var(--");
        expect(html).not.toContain("#f4f7f3");
        expect(html).not.toContain("#2f7d4a");
        expect(html).not.toContain("#173d25");
    });

    test("keeps the Android free-access note in both parts", async () => {
        const body = await capture({ androidFreeAccess: true });
        const note =
            "Household recipes, planned meals, and grocery lists are shared; personal nutrition records remain private.";
        expect(String(body.text)).toContain(note);
        expect(String(body.html)).toContain(note);
        expect(String(body.text)).toContain(
            "Joining this household is free in the Android app.",
        );
        expect(String(body.html)).toContain(
            "Joining is free in the Android app.",
        );
    });

    test("fails closed when the Resend API key is missing", async () => {
        configureDelivery();
        delete process.env.RESEND_API_KEY;
        const fetchImpl = mock(
            async () => new Response(null, { status: 200 }),
        ) as unknown as typeof fetch;
        await expect(sendHouseholdInvitation(input, fetchImpl)).rejects.toThrow(
            "RESEND_API_KEY is required",
        );
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});
