const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

// Editorial Serif email theme (Amendment F, email scope): the house theme
// in email-safe form — Georgia serif display type, paper tones, hairline
// rules, brand green, and the Nutrition-Facts heavy bar over the card.
// Email-client reality: table layout, every style inline, no external
// CSS, no custom properties. Palette mirrors public/editorial.css; the
// shell matches src/auth/email.ts.
const EMAIL_SERIF = "Georgia, 'Times New Roman', Times, serif";
const EMAIL_SANS =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";
const EMAIL_PAPER = "#f6f1e7";
const EMAIL_CARD = "#fffdf8";
const EMAIL_INK = "#2b2620";
const EMAIL_INK_SOFT = "#4a4237";
const EMAIL_INK_MUTE = "#5d5344";
const EMAIL_HAIRLINE = "#d8cdb6";
const EMAIL_GREEN = "#176b3a";
const EMAIL_GREEN_DEEP = "#0b3d24";
const EMAIL_MARK_URL = "https://munch.business/brand/munch-mark-192.png";

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

function householdInvitationHtml(input: {
    householdName: string;
    invitedByDisplayName: string;
    acceptUrl: string;
    expiresAt: string;
    androidFreeAccess: boolean;
}): string {
    const hairline = `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td height="1" bgcolor="${EMAIL_HAIRLINE}" style="background-color: ${EMAIL_HAIRLINE}; font-size: 0; line-height: 0;">&nbsp;</td></tr></table>`;
    const androidNote = input.androidFreeAccess
        ? `<p style="margin-top:0;margin-right:0;margin-bottom:28px;margin-left:0;font-family:${EMAIL_SANS};font-size:15px;line-height:23px;color:${EMAIL_INK_SOFT};">Joining is free in the Android app. Household recipes, planned meals, and grocery lists are shared; personal nutrition records remain private.</p>`
        : "";
    const bodyMargin = input.androidFreeAccess ? "16px" : "28px";

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding-top: 0; padding-right: 0; padding-bottom: 0; padding-left: 0; background-color: ${EMAIL_PAPER};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
            <td align="center" bgcolor="${EMAIL_PAPER}" style="background-color: ${EMAIL_PAPER}; padding-top: 32px; padding-right: 16px; padding-bottom: 32px; padding-left: 16px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 560px;">
                    <tr>
                        <td height="8" bgcolor="${EMAIL_GREEN_DEEP}" style="background-color: ${EMAIL_GREEN_DEEP}; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td bgcolor="${EMAIL_CARD}" style="background-color: ${EMAIL_CARD}; border-right-width: 1px; border-right-style: solid; border-right-color: ${EMAIL_HAIRLINE}; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: ${EMAIL_HAIRLINE}; border-left-width: 1px; border-left-style: solid; border-left-color: ${EMAIL_HAIRLINE}; padding-top: 36px; padding-right: 36px; padding-bottom: 40px; padding-left: 36px;">
                            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                                <tr>
                                    <td bgcolor="${EMAIL_CARD}" style="background-color: ${EMAIL_CARD}; padding-bottom: 10px;">
                                        <img src="${EMAIL_MARK_URL}" width="48" height="48" alt="Munch" style="display: block; border: 0; outline: none; text-decoration: none;">
                                    </td>
                                </tr>
                            </table>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 20px; margin-left: 0; font-family: ${EMAIL_SERIF}; font-size: 15px; line-height: 22px; color: ${EMAIL_GREEN}; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">Munch</p>
                            ${hairline}
                            <h1 style="margin-top: 24px; margin-right: 0; margin-bottom: 16px; margin-left: 0; font-family: ${EMAIL_SERIF}; font-size: 28px; line-height: 36px; color: ${EMAIL_INK}; font-weight: 700;">Join ${escapeHtml(input.householdName)}</h1>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: ${bodyMargin}; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 25px; color: ${EMAIL_INK_SOFT};">${escapeHtml(input.invitedByDisplayName)} invited you to share recipes, planned meals, and a grocery list on Munch.</p>
                            ${androidNote}<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="${EMAIL_GREEN}" style="background-color: ${EMAIL_GREEN}; border-radius: 6px;"><a href="${escapeHtml(input.acceptUrl)}" style="display: inline-block; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px; font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 20px; color: #ffffff; font-weight: 700; text-decoration: none;">Accept invitation</a></td></tr></table>
                            <div style="margin-top: 28px; margin-bottom: 16px;">${hairline}</div>
                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 13px; line-height: 20px; color: ${EMAIL_INK_MUTE};">Expires ${escapeHtml(input.expiresAt)}. If you were not expecting this, ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export async function sendHouseholdInvitation(
    input: {
        email: string;
        householdName: string;
        invitedByDisplayName: string;
        acceptUrl: string;
        expiresAt: string;
        androidFreeAccess: boolean;
    },
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    const text = [
        `${input.invitedByDisplayName} invited you to ${input.householdName} on Munch.`,
        "",
        ...(input.androidFreeAccess
            ? [
                  "Joining this household is free in the Android app. Household recipes, planned meals, and grocery lists are shared; personal nutrition records remain private.",
                  "",
              ]
            : []),
        "Accept the invitation:",
        input.acceptUrl,
        "",
        `The invitation expires at ${input.expiresAt}.`,
        "If you were not expecting this invitation, ignore this email.",
    ].join("\n");
    const response = await fetchImpl(RESEND_EMAILS_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${required("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: required("MUNCH_EMAIL_FROM"),
            to: [input.email],
            subject: `${input.invitedByDisplayName} invited you to a Munch household`,
            text,
            html: householdInvitationHtml(input),
        }),
        signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
        throw new Error("Resend rejected the household invitation request");
    }
}
