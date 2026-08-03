#!/usr/bin/env bun

import { SQL } from "bun";
import { createHash } from "node:crypto";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required. On Railway, reference the PostgreSQL service's DATABASE_URL variable.",
    );
}

const migrationsDirectory = path.resolve("db/migrations");
const database = new SQL({
    url: databaseUrl,
    max: 1,
    idleTimeout: 20,
    connectionTimeout: 10,
});

function checksum(source: string): string {
    return createHash("sha256").update(source).digest("hex");
}

function migrationVersion(fileName: string): string {
    const match = fileName.match(/^(\d{4,})_[a-z0-9_-]+\.sql$/i);
    if (!match?.[1]) {
        throw new Error(
            `Invalid migration filename ${fileName}; expected NNNN_description.sql`,
        );
    }
    return match[1];
}

await database.unsafe(`
    create schema if not exists munch;
    create table if not exists munch.schema_migrations (
        version text primary key,
        file_name text not null unique,
        checksum_sha256 text not null,
        applied_at timestamptz not null default now()
    );
`);

const files = (
    await Array.fromAsync(
        new Bun.Glob("*.sql").scan({
            cwd: migrationsDirectory,
            absolute: false,
        }),
    )
).sort();

if (files.length === 0) {
    throw new Error(`No SQL migrations found in ${migrationsDirectory}`);
}

for (const fileName of files) {
    const version = migrationVersion(fileName);
    const filePath = path.join(migrationsDirectory, fileName);
    const source = await Bun.file(filePath).text();
    const sourceChecksum = checksum(source);

    const existing = await database<
        Array<{ checksum_sha256: string; file_name: string }>
    >`
        select checksum_sha256, file_name
        from munch.schema_migrations
        where version = ${version}
    `;

    const applied = existing[0];
    if (applied) {
        if (
            applied.checksum_sha256 !== sourceChecksum ||
            applied.file_name !== fileName
        ) {
            throw new Error(
                `Migration ${version} was modified after application. ` +
                    `Database has ${applied.file_name}/${applied.checksum_sha256}; ` +
                    `repository has ${fileName}/${sourceChecksum}.`,
            );
        }
        console.log(`skip ${fileName} (already applied)`);
        continue;
    }

    console.log(`apply ${fileName}`);
    await database.begin(async (tx) => {
        await tx.unsafe(source);
        await tx`
            insert into munch.schema_migrations (
                version,
                file_name,
                checksum_sha256
            ) values (
                ${version},
                ${fileName},
                ${sourceChecksum}
            )
        `;
    });
}

await database.close();
console.log("Database migrations are current.");
