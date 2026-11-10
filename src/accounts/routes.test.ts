import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { createAccountRouter } from "./routes.js";

function accountApp(): Hono {
    const app = new Hono();
    app.route("/", createAccountRouter());
    return app;
}

describe("account router landings", () => {
    test("the retired portal landing redirects to the signed-in home", async () => {
        // "/account/portal" was the post-sign-in default long after the
        // portal itself was retired, and already-sent magic-link emails
        // still carry it as their return target. It must resolve to the
        // signed-in home, never the 404 those arrivals used to meet.
        const response = await accountApp().request(
            "https://munch.test/account/portal",
        );
        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe("/app");
    });

    test("the login door defaults its return target to the signed-in home", async () => {
        const response = await accountApp().request(
            "https://munch.test/account/login",
        );
        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe(
            "/connect/sign-in?return_to=%2Fapp",
        );
    });
});
