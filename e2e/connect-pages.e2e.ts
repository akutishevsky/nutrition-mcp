import { expect, test } from "@playwright/test";

/**
 * Live route regression for the flagship build: the bare /connect page
 * must serve the Editorial Serif instructions page while the OAuth
 * namespace under /connect/* keeps reaching auth untouched.
 */

const MARKETING_MARKER = "Prefer to tap it in yourself";
const PASTE_OPENING = "Connect me to Munch, my nutrition tracker.";

test("homepage serves the flagship with the paste block and trial", async ({
    request,
}) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(PASTE_OPENING);
    expect(body).toContain("Persistent nutrition for your AI");
    expect(body).toContain("7-day free trial");
    expect(body).toContain('href="/connect"');
    expect(body).not.toContain('href="/connect/sign-in');
});

test("/connect serves the instructions page, indexable and canonical", async ({
    request,
}) => {
    const response = await request.get("/connect");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(PASTE_OPENING);
    expect(body).toContain(MARKETING_MARKER);
    expect(body).toContain("https://munch.business/connect");
    expect(body).not.toContain("noindex");
});

test("/connect/ 301-redirects to /connect", async ({ request }) => {
    const response = await request.get("/connect/", { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers()["location"]).toBe("/connect");
});

test("/help/connect-chatgpt 301-redirects to /connect", async ({ request }) => {
    for (const path of ["/help/connect-chatgpt", "/help/connect-chatgpt/"]) {
        const response = await request.get(path, { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(response.headers()["location"]).toBe("/connect");
    }
});

test("OAuth subpaths still reach auth, not the marketing page", async ({
    request,
}) => {
    const signIn = await request.get("/connect/sign-in");
    expect(signIn.status()).toBe(200);
    const signInBody = await signIn.text();
    expect(signInBody).toContain("Connect Munch to ChatGPT");
    expect(signInBody).toContain('action="/connect/request"');
    expect(signInBody).not.toContain(MARKETING_MARKER);

    const confirm = await request.get("/connect/confirm");
    expect(confirm.status()).toBe(200);
    const confirmBody = await confirm.text();
    expect(confirmBody).toContain("Continue signing in");
    expect(confirmBody).not.toContain(MARKETING_MARKER);

    const consent = await request.get("/connect/consent");
    expect([200, 302, 400]).toContain(consent.status());
    const consentBody = await consent.text();
    expect(consentBody).not.toContain(MARKETING_MARKER);
    expect(consentBody).not.toContain(PASTE_OPENING);

    const requestResponse = await request.post("/connect/request", {
        form: { email: "not-an-email" },
        maxRedirects: 0,
    });
    // Auth owns this route: it must never answer with the marketing page.
    const requestBody = await requestResponse.text();
    expect(requestBody).not.toContain(MARKETING_MARKER);
    expect(requestBody).not.toContain(PASTE_OPENING);
});

test("sitemap and llms.txt carry the connect story", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("https://munch.business/connect");
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain("Connect Munch to your AI");
    expect(llms).toContain("https://munch.business/connect");
});

test("/editorial.css is served", async ({ request }) => {
    const response = await request.get("/editorial.css");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/css");
});
