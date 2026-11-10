import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the packaged `.mobile-web` bundle only.
 * Deliberately separate from playwright.config.ts: this lane needs no
 * application server and no database — the spec serves the static bundle
 * itself — so it can run anywhere the bundle can be built.
 */
export default defineConfig({
    testDir: "./e2e",
    testMatch: "mobile-*.e2e.ts",
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? "line" : "list",
    use: {
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "mobile-bundle-pixel-7",
            use: { ...devices["Pixel 7"] },
        },
    ],
});
