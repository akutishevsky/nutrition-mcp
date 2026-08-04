#!/usr/bin/env bun

Object.assign(process.env, {
    NODE_ENV: "production",
    MUNCH_RAILWAY_AUTH_ENABLED: "true",
    MUNCH_RAILWAY_DATA_ENABLED: "true",
    MUNCH_APP_BASE_URL: "https://munch.example",
    MUNCH_SESSION_SECRET: "operations-smoke-session-secret-0123456789abcdef",
    MUNCH_DEV_EXPOSE_LOGIN_LINK: "false",
    MUNCH_LOGIN_DELIVERY_ENDPOINT: "https://mail.example/deliver",
    MUNCH_LOGIN_DELIVERY_SECRET: "operations-smoke-delivery-secret",
    STRIPE_SECRET_KEY: "sk_test_operations",
    STRIPE_WEBHOOK_SECRET: "whsec_operations",
    STRIPE_PRICE_ID: "price_operations",
    OFF_USER_AGENT: "Munch operations smoke (test@example.com)",
    USDA_FDC_API_KEY: "operations-usda-key",
    MUNCH_DB_POOL_SIZE: "5",
});

const { Hono } = await import("hono");
const { buildReadinessReport } = await import("../src/operations/readiness.js");
const { createOperationsRouter } = await import("../src/operations/routes.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for operations smoke tests");
}

const report = await buildReadinessReport();
if (!report.ready || report.backend !== "railway") {
    throw new Error(`Readiness failed: ${JSON.stringify(report)}`);
}
for (const required of [
    "configuration",
    "database",
    "migrations",
    "database_roles",
    "row_level_security",
]) {
    if (
        !report.components.some(
            (component) => component.name === required && component.ok,
        )
    ) {
        throw new Error(`Readiness component ${required} was unavailable`);
    }
}

const app = new Hono();
app.route("/", createOperationsRouter());
const live = await app.request("https://munch.example/health/live");
if (live.status !== 200 || live.headers.get("cache-control") !== "no-store") {
    throw new Error("Liveness route failed");
}
const ready = await app.request("https://munch.example/health/ready");
if (
    ready.status !== 200 ||
    !((await ready.json()) as { ready: boolean }).ready
) {
    throw new Error("Readiness route failed");
}

await closePlatformDatabase();
const maintenance = Bun.spawn(["bun", "scripts/maintenance.ts"], {
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
});
const [exitCode, stdout, stderr] = await Promise.all([
    maintenance.exited,
    new Response(maintenance.stdout).text(),
    new Response(maintenance.stderr).text(),
]);
if (exitCode !== 0) {
    throw new Error(`Maintenance failed: ${stderr || stdout}`);
}
const result = JSON.parse(stdout.trim()) as { maintenance?: string };
if (result.maintenance !== "complete") {
    throw new Error("Maintenance did not return a completion result");
}

console.log("Munch readiness endpoints and maintenance smoke test passed.");
