interface MagicLinkDeliveryInput {
    email: string;
    loginUrl: string;
    expiresAt: Date;
}

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function magicLinkText(input: MagicLinkDeliveryInput): string {
    return [
        "Sign in to Munch",
        "",
        "Open the link below, then confirm the sign-in on the Munch page:",
        input.loginUrl,
        "",
        `This link expires at ${input.expiresAt.toISOString()}.`,
        "If you did not request this email, you can ignore it.",
    ].join("\n");
}

function magicLinkHtml(input: MagicLinkDeliveryInput): string {
    const loginUrl = escapeHtml(input.loginUrl);
    const expiresAt = escapeHtml(input.expiresAt.toISOString());

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding-top: 0; padding-right: 0; padding-bottom: 0; padding-left: 0; background-color: #f4f7f3;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
            <td align="center" bgcolor="#f4f7f3" style="background-color: #f4f7f3; padding-top: 32px; padding-right: 16px; padding-bottom: 32px; padding-left: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px;">
                    <tr>
                        <td bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 18px; padding-top: 40px; padding-right: 36px; padding-bottom: 40px; padding-left: 36px;">
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 12px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 22px; color: #4c6b55; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Munch</p>
                            <h1 style="margin-top: 0; margin-right: 0; margin-bottom: 16px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 30px; line-height: 38px; color: #173d25; font-weight: 700;">Sign in to Munch</h1>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 28px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #405347;">Use the button below to open Munch. You will confirm the sign-in on the next page before the link is redeemed.</p>
                            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                                <tr>
                                    <td bgcolor="#2f7d4a" style="background-color: #2f7d4a; border-radius: 10px;">
                                        <a href="${loginUrl}" style="display: inline-block; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; color: #ffffff; font-weight: 700; text-decoration: none;">Continue signing in</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin-top: 28px; margin-right: 0; margin-bottom: 8px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #68776d;">This link expires at ${expiresAt}.</p>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 8px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #68776d;">If the button does not work, copy and paste this address into your browser:</p>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 24px; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #2f7d4a; word-break: break-all;">${loginUrl}</p>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: #68776d;">If you did not request this email, you can ignore it.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export async function sendBetterAuthMagicLink(
    input: MagicLinkDeliveryInput,
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    const response = await fetchImpl(RESEND_EMAILS_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${required("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: required("MUNCH_EMAIL_FROM"),
            to: [input.email],
            subject: "Sign in to Munch",
            text: magicLinkText(input),
            html: magicLinkHtml(input),
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error("Resend rejected the magic-link email request");
    }
}
