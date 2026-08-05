#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const { exportMeals, getRailwayExportFile } = await import("../src/export.js");
const { cleanupExpiredExports, createExportFile } =
    await import("../src/service-platform/repository.js");
const storage = await import("../src/storage.js");
const { closePlatformDatabase, withServiceDatabase } =
    await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required for the service-platform smoke test",
    );
}

const challenge = await createLoginChallenge(
    `service-${crypto.randomUUID()}@example.test`,
);
const session = await consumeLoginChallenge(challenge.token);
if (!session) {
    throw new Error("Unable to activate service-platform smoke user");
}

const meal = await storage.insertMeal(challenge.userId, {
    description: "Service facilities smoke meal",
    meal_type: "lunch",
    calories: 640,
    protein_g: 35,
    carbs_g: 70,
    fat_g: 20,
    logged_at: "2026-08-03T16:00:00.000Z",
});
if (meal.meal.user_id !== challenge.userId) {
    throw new Error("Storage facade did not use Railway nutrition repository");
}

const cachePayload = {
    code: "0123456789012",
    product_name: "Smoke product",
    nutriments: { "energy-kcal_100g": 123 },
};
await storage.cacheFood("openfoodfacts", cachePayload.code, cachePayload);
const cached = await storage.getCachedFood<typeof cachePayload>(
    "openfoodfacts",
    cachePayload.code,
);
if (cached?.product_name !== cachePayload.product_name) {
    throw new Error("Railway food cache round trip failed");
}

await storage.insertToolAnalytics({
    user_id: challenge.userId,
    tool_name: "service_platform_smoke",
    success: true,
    duration_ms: 12.7,
    date_range_days: 1,
    mcp_session_id: "raw-session-id-must-not-be-stored",
});

const analyticsRows = await withServiceDatabase(
    async (tx) =>
        tx<
            Array<{
                session_hash: string | null;
                duration_ms: number;
            }>
        >`
        select session_hash, duration_ms
        from munch.tool_events
        where user_id = ${challenge.userId}
          and tool_name = 'service_platform_smoke'
        order by invoked_at desc
        limit 1
    `,
);
if (
    !analyticsRows[0]?.session_hash ||
    analyticsRows[0].session_hash === "raw-session-id-must-not-be-stored" ||
    analyticsRows[0].duration_ms !== 13
) {
    throw new Error("Tool-event redaction or normalization failed");
}

const stats = await storage.getLandingStats();
if (stats.total_users < 1 || stats.total_meals < 1) {
    throw new Error("Privacy-minimized landing statistics were not available");
}
if (stats.countries.length !== 0) {
    throw new Error("Railway landing statistics exposed geographic breakdowns");
}

const exported = await exportMeals(challenge.userId);
if (!exported.url) {
    throw new Error("Railway export did not return a download URL");
}
const exportUrl = new URL(exported.url);
if (exportUrl.pathname !== "/exports/download") {
    throw new Error("Railway export used an unexpected download route");
}
const token = exportUrl.searchParams.get("token");
if (!token) {
    throw new Error("Railway export did not issue a capability token");
}
const file = await getRailwayExportFile(token);
if (
    !file ||
    !file.content.includes("Service facilities smoke meal") ||
    !file.fileName.startsWith("munch-meals-")
) {
    throw new Error("Railway CSV export could not be retrieved");
}
if (await getRailwayExportFile(`${token}x`)) {
    throw new Error("Invalid Railway export capability token was accepted");
}

await createExportFile({
    userId: challenge.userId,
    fileName: "expired.csv",
    content: "id\r\nexpired\r\n",
    expiresAt: new Date(Date.now() - 1_000),
});
if ((await cleanupExpiredExports()) < 1) {
    throw new Error("Expired Railway exports were not cleaned up");
}

let serviceMealReadDenied = false;
try {
    await withServiceDatabase(async (tx) => {
        await tx`select description from munch.meals limit 1`;
    });
} catch {
    serviceMealReadDenied = true;
}
if (!serviceMealReadDenied) {
    throw new Error("Service role was able to inspect nutrition rows directly");
}

await closePlatformDatabase();
console.log("Munch Railway service facilities smoke test passed.");
