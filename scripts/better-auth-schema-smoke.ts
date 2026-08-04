import { getMigrations } from "better-auth/db/migration";
import { getMunchBetterAuth } from "../src/auth/auth.js";

const auth = getMunchBetterAuth();
const migrations = await getMigrations(auth.options);
const missingTables = migrations.toBeCreated.map((table) => table.table);
const missingFields = migrations.toBeAdded.map(
    (field) => `${field.table}.${field.field}`,
);

if (missingTables.length > 0 || missingFields.length > 0) {
    console.error(
        JSON.stringify(
            {
                error: "better_auth_schema_drift",
                missingTables,
                missingFields,
            },
            null,
            2,
        ),
    );
    process.exit(1);
}

console.log("Better Auth database schema is current.");
process.exit(0);
