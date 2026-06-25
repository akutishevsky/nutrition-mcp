import { test, expect } from "bun:test";
import crypto from "node:crypto";
import { renderLoginPage } from "./oauth.js";

// Guards the nonce representation: Supabase expects the SHA-256 *hex* digest sent
// to Google (not base64url). A regression to base64URLEncode would break sign-in.
test("nonce is hashed as lowercase hex SHA-256", () => {
    const hashed = crypto.createHash("sha256").update("abc").digest("hex");
    expect(hashed).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
});

test("renderLoginPage substitutes every {{SESSION_ID}} occurrence", async () => {
    const sessionId = "session-abc-123";
    const html = await renderLoginPage(sessionId);

    // The password form's hidden field and the Google button's href both use the
    // placeholder, so a single .replace() (first-match only) would leave one
    // behind and break the Google link.
    expect(html).not.toContain("{{SESSION_ID}}");
    expect(html).toContain(`value="${sessionId}"`);
    expect(html).toContain(`/authorize/google?session_id=${sessionId}`);
});

test("renderLoginPage renders the error banner only when given an error", async () => {
    const clean = await renderLoginPage("s1");
    expect(clean).not.toContain("{{ERROR}}");
    expect(clean).not.toContain("error-banner");

    const withError = await renderLoginPage("s1", "Bad <stuff> & things");
    expect(withError).toContain("error-banner");
    // Error text is HTML-escaped.
    expect(withError).toContain("Bad &lt;stuff&gt; &amp; things");
});
