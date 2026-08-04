import { getMigrations } from "better-auth/db/migration";
import { Pool } from "pg";
import { getMunchBetterAuth } from "../src/auth/auth.js";

const auth = getMunchBetterAuth();
const migrations = await getMigrations(auth.options);
const missingTables = migrations.toBeCreated.map((table) => table.table);
const missingFields = migrations.toBeAdded.map(
    (field) => `${field.table}.${field.field}`,
);

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const database = new Pool({ connectionString: databaseUrl, max: 1 });

const expectedJsonTextFields = [
    ["oauthClient", "scopes"],
    ["oauthClient", "contacts"],
    ["oauthClient", "redirectUris"],
    ["oauthClient", "postLogoutRedirectUris"],
    ["oauthClient", "grantTypes"],
    ["oauthClient", "responseTypes"],
    ["oauthClient", "resources"],
    ["oauthRefreshToken", "scopes"],
    ["oauthAccessToken", "scopes"],
    ["oauthConsent", "scopes"],
] as const;

const columns = await database.query<{
    table_name: string;
    column_name: string;
    data_type: string;
}>(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'munch'
      and table_name in (
          'oauthClient',
          'oauthRefreshToken',
          'oauthAccessToken',
          'oauthConsent'
      )
`);
await database.end();

const columnTypes = new Map(
    columns.rows.map((column) => [
        `${column.table_name}.${column.column_name}`,
        column.data_type,
    ]),
);
const incompatibleFields = expectedJsonTextFields
    .map(([table, field]) => `${table}.${field}`)
    .filter((field) => columnTypes.get(field) !== "text");

if (
    missingTables.length > 0 ||
    missingFields.length > 0 ||
    incompatibleFields.length > 0
) {
    console.error(
        JSON.stringify(
            {
                error: "better_auth_schema_drift",
                missingTables,
                missingFields,
                incompatibleFields,
            },
            null,
            2,
        ),
    );
    process.exit(1);
}

console.log("Better Auth database schema is current.");
process.exit(0);
