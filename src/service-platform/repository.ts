import { createHash } from "node:crypto";
import { withServiceDatabase } from "../platform/database.js";
import {
    hashOpaqueToken,
    issueOpaqueToken,
} from "../platform/tokens.js";

export interface CountryStat {
    country: string;
    count: number;
}

export interface LandingStats {
    total_users: number;
    total_meals: number;
    active_users_30d: number;
    countries: CountryStat[];
}

export interface ExportFile {
    fileName: string;
    contentType: string;
    content: string;
    expiresAt: Date;
}

function finiteInteger(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.trunc(parsed));
}

export async function getCachedFood(
    source: string,
    sourceId: string,
): Promise<unknown | null> {
    return withServiceDatabase(async (tx) => {
        const rows = await tx<Array<{ payload: unknown }>>`
            select payload
            from munch.food_cache
            where source = ${source}
              and source_id = ${sourceId}
        `;
        return rows[0]?.payload ?? null;
    });
}

export async function cacheFood(
    source: string,
    sourceId: string,
    payload: unknown,
): Promise<void> {
    await withServiceDatabase(async (tx) => {
        await tx`
            insert into munch.food_cache (
                source,
                source_id,
                payload,
                fetched_at
            ) values (
                ${source},
                ${sourceId},
                ${JSON.stringify(payload)}::jsonb,
                now()
            )
            on conflict (source, source_id) do update
            set payload = excluded.payload,
                fetched_at = now()
        `;
    });
}

export async function insertToolAnalytics(row: {
    user_id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category?: string;
    date_range_days?: number;
    mcp_session_id?: string;
}): Promise<void> {
    const sessionHash = row.mcp_session_id
        ? createHash("sha256")
              .update(row.mcp_session_id, "utf8")
              .digest("hex")
        : null;

    await withServiceDatabase(async (tx) => {
        await tx`
            insert into munch.tool_events (
                user_id,
                tool_name,
                success,
                duration_ms,
                error_category,
                date_range_days,
                session_hash
            ) values (
                ${row.user_id},
                ${row.tool_name},
                ${row.success},
                ${Math.max(0, Math.round(row.duration_ms))},
                ${row.error_category ?? null},
                ${row.date_range_days ?? null},
                ${sessionHash}
            )
        `;
    });
}

export async function getLandingStats(): Promise<LandingStats> {
    return withServiceDatabase(async (tx) => {
        const rows = await tx<Array<{ stats: unknown }>>`
            select munch.public_landing_stats() as stats
        `;
        const raw = rows[0]?.stats;
        const parsed =
            typeof raw === "string"
                ? (JSON.parse(raw) as Record<string, unknown>)
                : ((raw ?? {}) as Record<string, unknown>);
        const countries = Array.isArray(parsed.countries)
            ? parsed.countries
                  .map((entry) => {
                      if (
                          typeof entry !== "object" ||
                          entry === null ||
                          !("country" in entry) ||
                          !("count" in entry)
                      ) {
                          return null;
                      }
                      const record = entry as {
                          country: unknown;
                          count: unknown;
                      };
                      return typeof record.country === "string"
                          ? {
                                country: record.country,
                                count: finiteInteger(record.count),
                            }
                          : null;
                  })
                  .filter((entry): entry is CountryStat => entry !== null)
            : [];

        return {
            total_users: finiteInteger(parsed.total_users),
            total_meals: finiteInteger(parsed.total_meals),
            active_users_30d: finiteInteger(parsed.active_users_30d),
            countries,
        };
    });
}

export async function createExportFile(input: {
    userId: string;
    fileName: string;
    content: string;
    expiresAt: Date;
}): Promise<{ token: string }> {
    if (!input.content) throw new Error("Export content cannot be empty");
    const token = issueOpaqueToken(32);

    await withServiceDatabase(async (tx) => {
        await tx`
            insert into munch.export_files (
                token_hash,
                user_id,
                file_name,
                content,
                expires_at
            ) values (
                ${token.hash},
                ${input.userId},
                ${input.fileName},
                ${input.content},
                ${input.expiresAt}
            )
        `;
    });

    return { token: token.token };
}

export async function consumeExportFile(
    token: string,
): Promise<ExportFile | null> {
    const tokenHash = hashOpaqueToken(token);

    return withServiceDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                file_name: string;
                content_type: string;
                content: string;
                expires_at: Date | string;
            }>
        >`
            update munch.export_files
            set downloaded_at = now()
            where token_hash = ${tokenHash}
              and expires_at > now()
            returning file_name, content_type, content, expires_at
        `;
        const row = rows[0];
        return row
            ? {
                  fileName: row.file_name,
                  contentType: row.content_type,
                  content: row.content,
                  expiresAt:
                      row.expires_at instanceof Date
                          ? row.expires_at
                          : new Date(row.expires_at),
              }
            : null;
    });
}

export async function deleteExportFile(token: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    await withServiceDatabase(async (tx) => {
        await tx`
            delete from munch.export_files
            where token_hash = ${tokenHash}
        `;
    });
}

export async function cleanupExpiredExports(): Promise<number> {
    return withServiceDatabase(async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            delete from munch.export_files
            where expires_at <= now()
            returning encode(token_hash, 'hex') as id
        `;
        return rows.length;
    });
}
