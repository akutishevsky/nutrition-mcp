interface MagicLinkDeliveryInput {
    email: string;
    loginUrl: string;
    expiresAt: Date;
}

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

// Editorial Serif email theme (Amendment F, email scope): the house theme
// in email-safe form — Georgia serif display type, paper tones, hairline
// rules, brand green, and the Nutrition-Facts heavy bar over the card.
// Email-client reality: table layout, every style inline, no external
// CSS, no custom properties. Palette mirrors public/editorial.css.
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

function emailHairline(): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td height="1" bgcolor="${EMAIL_HAIRLINE}" style="background-color: ${EMAIL_HAIRLINE}; font-size: 0; line-height: 0;">&nbsp;</td></tr></table>`;
}

function emailButton(url: string, label: string): string {
    return `<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="${EMAIL_GREEN}" style="background-color: ${EMAIL_GREEN}; border-radius: 6px;"><a href="${url}" style="display: inline-block; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px; font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 20px; color: #ffffff; font-weight: 700; text-decoration: none;">${label}</a></td></tr></table>`;
}

/**
 * Shared Editorial Serif shell for Munch transactional email. The layout
 * is complete with images blocked: the apple mark carries alt text on the
 * card background, and every word of the message is real text.
 */
function themedEmailHtml(content: string): string {
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
                            ${emailHairline()}
${content}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function emailTitle(title: string): string {
    return `                            <h1 style="margin-top: 24px; margin-right: 0; margin-bottom: 16px; margin-left: 0; font-family: ${EMAIL_SERIF}; font-size: 30px; line-height: 38px; color: ${EMAIL_INK}; font-weight: 700;">${title}</h1>`;
}

function emailBody(text: string): string {
    return `                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 28px; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 25px; color: ${EMAIL_INK_SOFT};">${text}</p>`;
}

function emailNote(text: string, last = false): string {
    return `                            <p style="margin-top: 0; margin-right: 0; margin-bottom: ${last ? "0" : "8px"}; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 13px; line-height: 20px; color: ${EMAIL_INK_MUTE};">${text}</p>`;
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

    const content = [
        emailTitle("Sign in to Munch"),
        emailBody(
            "Use the button below to open Munch. You will confirm the sign-in on the next page before the link is redeemed.",
        ),
        `                            ${emailButton(loginUrl, "Continue signing in")}`,
        `                            <div style="margin-top: 28px; margin-bottom: 16px;">${emailHairline()}</div>`,
        emailNote(`This link expires at ${expiresAt}.`),
        emailNote(
            "If the button does not work, copy and paste this address into your browser:",
        ),
        `                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 24px; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 13px; line-height: 20px; color: ${EMAIL_GREEN}; word-break: break-all;">${loginUrl}</p>`,
        emailNote(
            "If you did not request this email, you can ignore it.",
            true,
        ),
    ].join("\n");

    return themedEmailHtml(content);
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

interface AuthLinkInput {
    email: string;
    url: string;
}

async function sendAuthLinkEmail(
    input: AuthLinkInput,
    subject: string,
    title: string,
    description: string,
    buttonLabel: string,
    failureMessage: string,
    fetchImpl: typeof fetch,
): Promise<void> {
    const url = escapeHtml(input.url);

    const content = [
        emailTitle(escapeHtml(title)),
        emailBody(escapeHtml(description)),
        `                            ${emailButton(url, escapeHtml(buttonLabel))}`,
        `                            <div style="margin-top: 28px; margin-bottom: 16px;">${emailHairline()}</div>`,
        emailNote(
            "If the button does not work, copy and paste this address into your browser:",
        ),
        `                            <p style="margin-top: 0; margin-right: 0; margin-bottom: 24px; margin-left: 0; font-family: ${EMAIL_SANS}; font-size: 13px; line-height: 20px; color: ${EMAIL_GREEN}; word-break: break-all;">${url}</p>`,
        emailNote(
            "If you did not request this email, you can ignore it.",
            true,
        ),
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
            subject,
            text: [
                title,
                "",
                description,
                "",
                input.url,
                "",
                "If you did not request this email, you can ignore it.",
            ].join("\n"),
            html: themedEmailHtml(content),
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(failureMessage);
}

export async function sendBetterAuthVerificationEmail(
    input: { email: string; verificationUrl: string },
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    await sendAuthLinkEmail(
        { email: input.email, url: input.verificationUrl },
        "Verify your Munch email",
        "Verify your email",
        "Confirm your email address to finish creating your Munch account.",
        "Verify email address",
        "Resend rejected the email-verification request",
        fetchImpl,
    );
}

export async function sendBetterAuthPasswordReset(
    input: { email: string; resetUrl: string },
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    await sendAuthLinkEmail(
        { email: input.email, url: input.resetUrl },
        "Reset your Munch password",
        "Reset your password",
        "Use the button below to choose a new password for your Munch account.",
        "Reset password",
        "Resend rejected the password-reset request",
        fetchImpl,
    );
}
