import { expect, test } from "bun:test";
import { Hono } from "hono";
import {
    createMealHistoryRouter,
    injectMealHistoryIntoPortal,
    portalMealHistorySection,
} from "./meal-history.js";

test("portal meal history is injected once and explicitly keeps zero-calorie records", () => {
    const base =
        '<!doctype html><body><div class="portal-grid"><section>Existing controls</section></div></body>';
    const injected = injectMealHistoryIntoPortal(base);

    expect(injected).toContain('id="meal-history-card"');
    expect(injected).toContain("Zero-calorie entries are included.");
    expect(injected).toContain("/account/portal/meals");
    expect(injectMealHistoryIntoPortal(injected)).toBe(injected);
    expect(portalMealHistorySection()).toContain("Meal history");
});

test("portal markup is left unchanged when the expected page markers are absent", () => {
    const html = "<html><body>Different page</body></html>";
    expect(injectMealHistoryIntoPortal(html)).toBe(html);
});

test("portal controls stylesheet is publicly served with the correct MIME type", async () => {
    const app = new Hono();
    app.route("/", createMealHistoryRouter());

    const response = await app.request(
        "https://munch.example/portal-controls.css",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    expect(await response.text()).toContain("portal-");
});

test("meal history data remains protected by the web session", async () => {
    const app = new Hono();
    app.route("/", createMealHistoryRouter());

    const response = await app.request(
        "https://munch.example/account/portal/meals?date=2026-08-05",
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "authentication_required" });
});
