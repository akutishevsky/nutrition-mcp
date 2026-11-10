import { afterEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { createPasswordRouter } from "./password-routes.js";

const original = { ...process.env };

afterEach(() => {
    for (const key of Object.keys(process.env)) {
        if (!(key in original)) delete process.env[key];
    }
    Object.assign(process.env, original);
});

function app() {
    const value = new Hono();
    value.route("/", createPasswordRouter());
    return value;
}

function configure() {
    Object.assign(process.env, {
        MUNCH_APP_BASE_URL: "https://munch.example",
        BETTER_AUTH_SECRET: "12345678901234567890123456789012",
        DATABASE_URL: "postgresql://example",
    });
}

describe("password authentication pages", () => {
    test("keeps public password signup behind the explicit feature flag", async () => {
        configure();
        const response = await app().request(
            "https://munch.example/account/password",
        );
        const html = await response.text();
        expect(response.status).toBe(200);
        expect(html).not.toContain('id="password-sign-up"');
        expect(html).toContain("controlled provisioning flow");
    });

    test("renders username signup and preserves OAuth continuation state when enabled", async () => {
        configure();
        process.env.MUNCH_PUBLIC_PASSWORD_SIGNUP = "true";
        const response = await app().request(
            "https://munch.example/account/password?return_to=/app&oauth_query=client_id%3Dclient-1%26scope%3Dnutrition.read",
        );
        const html = await response.text();
        expect(html).toContain('id="password-sign-up"');
        expect(html).toContain('name="username"');
        expect(html).toContain("client_id=client-1");
        expect(html).toContain("/api/auth/sign-in/username");
    });

    test("password page hides Google until the web client is configured", async () => {
        configure();
        delete process.env.MUNCH_GOOGLE_WEB_CLIENT_ID;
        delete process.env.MUNCH_GOOGLE_CLIENT_SECRET;
        const response = await app().request(
            "https://munch.example/account/password",
        );
        const html = await response.text();
        expect(html).toContain('id="password-sign-in"');
        expect(html).not.toContain("Continue with Google");
        expect(html).not.toContain("data-social-sign-in");
    });

    test("password page renders the Google control once configured", async () => {
        configure();
        process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
            "web-client-id.apps.googleusercontent.com";
        process.env.MUNCH_GOOGLE_CLIENT_SECRET = "server-only-secret";
        const response = await app().request(
            "https://munch.example/account/password?return_to=/app",
        );
        const html = await response.text();
        expect(html).toContain("Continue with Google");
        expect(html).toContain('data-social-path="/api/auth/sign-in/social"');
        expect(html).toContain('id="password-sign-in"');
        expect(html).not.toContain("server-only-secret");
    });

    test("renders the reset request page without exposing secrets", async () => {
        configure();
        const response = await app().request(
            "https://munch.example/account/password/reset",
        );
        const html = await response.text();
        expect(response.status).toBe(200);
        expect(html).toContain('id="password-reset-request"');
        expect(html).not.toContain("DATABASE_URL");
    });
});
