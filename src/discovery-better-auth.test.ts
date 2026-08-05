import { expect, test } from "bun:test";
import { Hono } from "hono";
import {
    BETTER_AUTH_ISSUER_PATH,
    registerDiscoveryRoutes,
} from "./discovery.js";

const HOST = "munch.example";

function fetchDiscovery(app: Hono, path: string) {
    return app.request(`http://localhost${path}`, {
        headers: {
            "x-forwarded-proto": "https",
            "x-forwarded-host": HOST,
        },
    });
}

test("serves OAuth and OpenID-compatible metadata at paths derived from the Better Auth issuer", async () => {
    const app = new Hono();
    registerDiscoveryRoutes(app);

    for (const path of [
        `/.well-known/oauth-authorization-server${BETTER_AUTH_ISSUER_PATH}`,
        `${BETTER_AUTH_ISSUER_PATH}/.well-known/oauth-authorization-server`,
        `/.well-known/openid-configuration${BETTER_AUTH_ISSUER_PATH}`,
        `${BETTER_AUTH_ISSUER_PATH}/.well-known/openid-configuration`,
    ]) {
        const response = await fetchDiscovery(app, path);
        expect(response.status, `${path} must not 404`).toBe(200);
        expect(response.headers.get("content-type")).toContain(
            "application/json",
        );
    }
});
