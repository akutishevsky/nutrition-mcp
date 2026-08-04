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

export async function sendHouseholdInvitation(
    input: {
        email: string;
        householdName: string;
        invitedByDisplayName: string;
        acceptUrl: string;
        expiresAt: string;
    },
    fetchImpl: typeof fetch = fetch,
): Promise<void> {
    const text = [
        `${input.invitedByDisplayName} invited you to ${input.householdName} on Munch.`,
        "",
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
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"></head><body style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;background-color:#f4f7f3;"><table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td align="center" bgcolor="#f4f7f3" style="background-color:#f4f7f3;padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:560px;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:18px;padding-top:40px;padding-right:36px;padding-bottom:40px;padding-left:36px;"><p style="margin-top:0;margin-right:0;margin-bottom:12px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#4c6b55;font-weight:700;">Munch</p><h1 style="margin-top:0;margin-right:0;margin-bottom:16px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:36px;color:#173d25;font-weight:700;">Join ${escapeHtml(input.householdName)}</h1><p style="margin-top:0;margin-right:0;margin-bottom:28px;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#405347;">${escapeHtml(input.invitedByDisplayName)} invited you to share recipes, planned meals, and a grocery list on Munch.</p><table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#2f7d4a" style="background-color:#2f7d4a;border-radius:10px;"><a href="${escapeHtml(input.acceptUrl)}" style="display:inline-block;padding-top:14px;padding-right:24px;padding-bottom:14px;padding-left:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;color:#ffffff;font-weight:700;text-decoration:none;">Accept invitation</a></td></tr></table><p style="margin-top:28px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#68776d;">Expires ${escapeHtml(input.expiresAt)}. If you were not expecting this, ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
        }),
        signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
        throw new Error("Resend rejected the household invitation request");
    }
}
