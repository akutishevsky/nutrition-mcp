import { afterEach, describe, expect, test } from "bun:test";
import { configurationIssues } from "./config.js";

const original = { ...process.env };

afterEach(() => {
    for (const key of Object.keys(process.env)) {
        if (!(key in original)) delete process.env[key];
    }
    Object.assign(process.env, original);
});

function validRailwayEnvironment() {
    Object.assign(process.env, {
        NODE_ENV: "production",
        MUNCH_RAILWAY_AUTH_ENABLED: "true",
        MUNCH_RAILWAY_DATA_ENABLED: "true",
        MUNCH_APP_BASE_URL: "https://munch.example",
        MUNCH_SESSION_SECRET: "x".repeat(64),
        MUNCH_DEV_EXPOSE_LOGIN_LINK: "false",
        MUNCH_LOGIN_DELIVERY_ENDPOINT: "https://mail.example/deliver",
        MUNCH_LOGIN_DELIVERY_SECRET: "delivery-secret",
        STRIPE_SECRET_KEY: "sk_test_example",
        STRIPE_WEBHOOK_SECRET: "whsec_example",
        STRIPE_PRICE_ID: "price_example",
        OFF_USER_AGENT: "Munch (support@example.com)",
        USDA_FDC_API_KEY: "usda-example",
        DATABASE_URL: "postgresql://example",
        MUNCH_DB_POOL_SIZE: "10",
    });
}

describe("Munch startup configuration", () => {
    test("accepts a complete Railway production configuration", () => {
        validRailwayEnvironment();
        expect(configurationIssues()).toEqual([]);
    });

    test("rejects mixed identity and data backends", () => {
        validRailwayEnvironment();
        process.env.MUNCH_RAILWAY_DATA_ENABLED = "false";
        expect(configurationIssues()).toContainEqual(
            expect.objectContaining({
                key: "MUNCH_RAILWAY_AUTH_ENABLED",
            }),
        );
    });

    test("rejects insecure production login and origin settings", () => {
        validRailwayEnvironment();
        process.env.MUNCH_APP_BASE_URL = "http://munch.example/path";
        process.env.MUNCH_LOGIN_DELIVERY_ENDPOINT = "http://mail.example";
        process.env.MUNCH_DEV_EXPOSE_LOGIN_LINK = "true";
        const keys = configurationIssues().map((issue) => issue.key);
        expect(keys).toContain("MUNCH_APP_BASE_URL");
        expect(keys).toContain("MUNCH_LOGIN_DELIVERY_ENDPOINT");
        expect(keys).toContain("MUNCH_DEV_EXPOSE_LOGIN_LINK");
    });

    test("requires provider and billing configuration", () => {
        validRailwayEnvironment();
        delete process.env.USDA_FDC_API_KEY;
        delete process.env.STRIPE_WEBHOOK_SECRET;
        const keys = configurationIssues().map((issue) => issue.key);
        expect(keys).toContain("USDA_FDC_API_KEY");
        expect(keys).toContain("STRIPE_WEBHOOK_SECRET");
    });
});
