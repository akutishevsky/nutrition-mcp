import { SQL } from "bun";

let database: SQL | null = null;

export type DatabaseTransaction = SQL;

function databaseUrl(): string {
    const value = process.env.DATABASE_URL?.trim();
    if (!value) {
        throw new Error("DATABASE_URL is required for Railway PostgreSQL access");
    }
    return value;
}

function poolSize(): number {
    const parsed = Number(process.env.MUNCH_DB_POOL_SIZE ?? 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
        throw new Error("MUNCH_DB_POOL_SIZE must be an integer between 1 and 50");
    }
    return parsed;
}

export function getPlatformDatabase(): SQL {
    if (!database) {
        database = new SQL({
            url: databaseUrl(),
            max: poolSize(),
            idleTimeout: 30,
            connectionTimeout: 10,
        });
    }
    return database;
}

async function setRole(
    tx: SQL,
    role: "munch_app" | "munch_auth" | "munch_billing" | "munch_support",
) {
    switch (role) {
        case "munch_app":
            await tx`set local role munch_app`;
            return;
        case "munch_auth":
            await tx`set local role munch_auth`;
            return;
        case "munch_billing":
            await tx`set local role munch_billing`;
            return;
        case "munch_support":
            await tx`set local role munch_support`;
            return;
    }
}

export async function withUserDatabase<T>(
    userId: string,
    callback: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            userId,
        )
    ) {
        throw new Error("Invalid user ID");
    }

    return getPlatformDatabase().begin(async (transaction) => {
        const tx = transaction as unknown as SQL;
        await setRole(tx, "munch_app");
        await tx`select set_config('app.user_id', ${userId}, true)`;
        return callback(tx);
    });
}

export async function withAuthDatabase<T>(
    callback: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
    return getPlatformDatabase().begin(async (transaction) => {
        const tx = transaction as unknown as SQL;
        await setRole(tx, "munch_auth");
        return callback(tx);
    });
}

export async function withBillingDatabase<T>(
    callback: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
    return getPlatformDatabase().begin(async (transaction) => {
        const tx = transaction as unknown as SQL;
        await setRole(tx, "munch_billing");
        return callback(tx);
    });
}

export async function withSupportDatabase<T>(
    callback: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
    return getPlatformDatabase().begin(async (transaction) => {
        const tx = transaction as unknown as SQL;
        await setRole(tx, "munch_support");
        return callback(tx);
    });
}

export function _resetPlatformDatabaseForTests(): void {
    database = null;
}
