#!/usr/bin/env bun

process.env.MUNCH_RAILWAY_DATA_ENABLED = "true";
process.env.MUNCH_RAILWAY_AUTH_ENABLED = "true";
process.env.MUNCH_APP_BASE_URL = "https://munch.example";

// This script intentionally exercises the destructive MCP handler only against
// the ephemeral PostgreSQL service created for CI acceptance testing.
const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } =
    await import("@modelcontextprotocol/sdk/inMemory.js");
const { createLoginChallenge, consumeLoginChallenge } =
    await import("../src/accounts/repository.js");
const { registerTools } = await import("../src/mcp.js");
const { closePlatformDatabase, getPlatformDatabase } =
    await import("../src/platform/database.js");
const storage = await import("../src/storage.js");

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required for account deletion smoke tests",
    );
}
if (
    process.env.CI !== "true" &&
    process.env.MUNCH_ALLOW_ACCOUNT_DELETION_SMOKE !== "true"
) {
    throw new Error(
        "Account deletion smoke tests may run only in CI or with an explicit disposable-database override",
    );
}

interface Counts {
    users: number;
    meals: number;
    sessions: number;
    loginTokens: number;
}

function toolText(result: unknown): string {
    const content = (result as { content?: Array<{ text?: unknown }> }).content;
    return Array.isArray(content)
        ? content
              .map((item) => (typeof item.text === "string" ? item.text : ""))
              .join("\n")
        : "";
}

const analyticsWarnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    analyticsWarnings.push(args.map(String).join(" "));
    originalWarn(...args);
};

const email = `account-deletion-${crypto.randomUUID()}@example.test`;
const challenge = await createLoginChallenge(email);
const session = await consumeLoginChallenge(challenge.token);
if (!session) {
    throw new Error("Unable to activate disposable account deletion user");
}
const userId = session.userId;

await storage.insertMeal(userId, {
    description: "Disposable account deletion smoke meal",
    meal_type: "snack",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    logged_at: "2026-08-05T12:00:00.000Z",
    notes: "Created only in the isolated CI database.",
});

const database = getPlatformDatabase();
async function counts(): Promise<Counts> {
    const rows = await database<
        Array<{
            users: number;
            meals: number;
            sessions: number;
            login_tokens: number;
        }>
    >`
        select
            (select count(*)::int from munch.users where id = ${userId}) as users,
            (select count(*)::int from munch.meals where user_id = ${userId}) as meals,
            (select count(*)::int from munch.web_sessions where user_id = ${userId}) as sessions,
            (select count(*)::int from munch.login_tokens where user_id = ${userId}) as login_tokens
    `;
    const row = rows[0];
    if (!row) throw new Error("Unable to inspect disposable account state");
    return {
        users: Number(row.users),
        meals: Number(row.meals),
        sessions: Number(row.sessions),
        loginTokens: Number(row.login_tokens),
    };
}

const server = new McpServer(
    { name: "munch-account-deletion-smoke", version: "0.0.0" },
    { capabilities: { tools: {}, resources: {} } },
);
registerTools(server, userId, true, null);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({
    name: "munch-account-deletion-smoke-client",
    version: "0.0.0",
});

try {
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);

    const initial = await counts();
    if (
        initial.users !== 1 ||
        initial.meals !== 1 ||
        initial.sessions !== 1 ||
        initial.loginTokens < 1
    ) {
        throw new Error(
            `Disposable account fixture is incomplete: ${JSON.stringify(initial)}`,
        );
    }

    const cancelled = await client.callTool({
        name: "delete_account",
        arguments: { confirm: false },
    });
    if (!toolText(cancelled).includes("Account deletion cancelled")) {
        throw new Error("delete_account did not honor confirm=false");
    }
    const afterCancellation = await counts();
    if (JSON.stringify(afterCancellation) !== JSON.stringify(initial)) {
        throw new Error("Cancelled account deletion changed persisted data");
    }

    const deleted = await client.callTool({
        name: "delete_account",
        arguments: { confirm: true },
    });
    if (!toolText(deleted).includes("permanently deleted")) {
        throw new Error(
            `delete_account did not report success: ${toolText(deleted)}`,
        );
    }

    const afterDeletion = await counts();
    if (
        afterDeletion.users !== 0 ||
        afterDeletion.meals !== 0 ||
        afterDeletion.sessions !== 0 ||
        afterDeletion.loginTokens !== 0
    ) {
        throw new Error(
            `Account deletion left persisted data behind: ${JSON.stringify(afterDeletion)}`,
        );
    }

    await Bun.sleep(50);
    if (
        analyticsWarnings.some((warning) =>
            warning.includes("Failed to persist analytics for delete_account"),
        )
    ) {
        throw new Error(
            "Account deletion attempted to persist analytics after removing the user",
        );
    }

    console.log(
        "Munch delete_account MCP tool confirmation and disposable-account cascade smoke test passed.",
    );
} finally {
    console.warn = originalWarn;
    await client.close().catch(() => undefined);
    await server.close().catch(() => undefined);
    await database`
        delete from munch.users
        where id = ${userId}
    `.catch(() => undefined);
    await closePlatformDatabase();
}
