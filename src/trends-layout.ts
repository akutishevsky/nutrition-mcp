import { withUserDatabase } from "./platform/database.js";
import { normalizeTrendsLayout, type TrendsLayout } from "./trends.js";

/**
 * Server-side storage for the Trends dashboard layout (T9): one row per
 * account in munch.trends_dashboard_layouts (migration 0038), read and
 * written under the user's RLS context like every other per-user table.
 * The layout contract itself lives in src/trends.ts; everything stored
 * or returned passes through normalizeTrendsLayout, so a malformed row
 * can never reach a client.
 */

export async function getTrendsDashboardLayout(
    userId: string,
): Promise<TrendsLayout> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ layout: unknown }>>`
            select layout from munch.trends_dashboard_layouts
            where user_id = ${userId}
        `;
        return normalizeTrendsLayout(rows[0]?.layout ?? null);
    });
}

export async function saveTrendsDashboardLayout(
    userId: string,
    layout: unknown,
): Promise<TrendsLayout> {
    const normalized = normalizeTrendsLayout(layout);
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ layout: unknown }>>`
            insert into munch.trends_dashboard_layouts (user_id, layout, version, updated_at)
            values (${userId}, ${normalized}::jsonb, 1, now())
            on conflict (user_id) do update
                set layout = excluded.layout,
                    version = munch.trends_dashboard_layouts.version + 1,
                    updated_at = now()
            returning layout
        `;
        return normalizeTrendsLayout(rows[0]?.layout ?? normalized);
    });
}
