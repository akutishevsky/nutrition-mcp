import path from "node:path";
import { getPlatformDatabase } from "../platform/database.js";
import { configurationIssues } from "./config.js";

export interface ReadinessComponent {
    name: string;
    ok: boolean;
    detail?: string;
}

export interface ReadinessReport {
    ready: boolean;
    backend: "railway" | "inherited";
    checkedAt: string;
    components: ReadinessComponent[];
}

async function repositoryMigrationVersions(): Promise<string[]> {
    const directory = path.resolve("db/migrations");
    const files = await Array.fromAsync(
        new Bun.Glob("*.sql").scan({ cwd: directory, absolute: false }),
    );
    return files
        .map((file) => file.match(/^(\d{4,})_/)?.[1])
        .filter((version): version is string => Boolean(version))
        .sort();
}

export async function buildReadinessReport(): Promise<ReadinessReport> {
    const railway =
        process.env.MUNCH_RAILWAY_AUTH_ENABLED === "true" &&
        process.env.MUNCH_RAILWAY_DATA_ENABLED === "true";
    const components: ReadinessComponent[] = [];
    const issues = configurationIssues();
    components.push({
        name: "configuration",
        ok: issues.length === 0,
        ...(issues.length > 0
            ? { detail: `${issues.length} configuration issue(s)` }
            : {}),
    });

    if (!railway) {
        return {
            ready: components.every((component) => component.ok),
            backend: "inherited",
            checkedAt: new Date().toISOString(),
            components,
        };
    }

    try {
        const database = getPlatformDatabase();
        await database`select 1 as ok`;
        components.push({ name: "database", ok: true });

        const expectedVersions = await repositoryMigrationVersions();
        const migrationRows = await database<Array<{ version: string }>>`
            select version from munch.schema_migrations order by version
        `;
        const applied = new Set(migrationRows.map((row) => row.version));
        const missing = expectedVersions.filter(
            (version) => !applied.has(version),
        );
        components.push({
            name: "migrations",
            ok: missing.length === 0,
            ...(missing.length > 0
                ? { detail: `${missing.length} migration(s) missing` }
                : {
                      detail: `${expectedVersions.length} migration(s) applied`,
                  }),
        });

        const requiredRoles = [
            "munch_app",
            "munch_auth",
            "munch_billing",
            "munch_support",
            "munch_service",
        ];
        const roleRows = await database<Array<{ rolname: string }>>`
            select rolname from pg_roles
            where rolname in ${database(requiredRoles)}
        `;
        const availableRoles = new Set(roleRows.map((row) => row.rolname));
        const missingRoles = requiredRoles.filter(
            (role) => !availableRoles.has(role),
        );
        components.push({
            name: "database_roles",
            ok: missingRoles.length === 0,
            ...(missingRoles.length > 0
                ? { detail: `${missingRoles.length} role(s) missing` }
                : {}),
        });

        const protectedTables = [
            "meals",
            "meal_items",
            "nutrition_goals",
            "water_logs",
            "weight_logs",
            "saved_foods",
            "meal_drafts",
            "meal_draft_items",
            "meal_draft_questions",
        ];
        const rlsRows = await database<
            Array<{
                relname: string;
                relrowsecurity: boolean;
                relforcerowsecurity: boolean;
            }>
        >`
            select c.relname, c.relrowsecurity, c.relforcerowsecurity
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'munch'
              and c.relname in ${database(protectedTables)}
        `;
        const secure = new Set(
            rlsRows
                .filter((row) => row.relrowsecurity && row.relforcerowsecurity)
                .map((row) => row.relname),
        );
        const insecureTables = protectedTables.filter(
            (table) => !secure.has(table),
        );
        components.push({
            name: "row_level_security",
            ok: insecureTables.length === 0,
            ...(insecureTables.length > 0
                ? { detail: `${insecureTables.length} table(s) not forced-RLS` }
                : {}),
        });
    } catch {
        components.push({
            name: "database",
            ok: false,
            detail: "Database readiness check failed",
        });
    }

    return {
        ready: components.every((component) => component.ok),
        backend: "railway",
        checkedAt: new Date().toISOString(),
        components,
    };
}
