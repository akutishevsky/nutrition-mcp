#!/usr/bin/env bun

import { getPlatformDatabase, closePlatformDatabase } from "../src/platform/database.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Munch maintenance");
}

const database = getPlatformDatabase();
const results: Record<string, number> = {};

async function remove(name: string, query: () => Promise<Array<{ id: string }>>) {
    const rows = await query();
    results[name] = rows.length;
}

await database.begin(async (tx) => {
    await remove("login_tokens", () => tx<Array<{ id: string }>>`
        delete from munch.login_tokens
        where expires_at < now() - interval '24 hours'
           or consumed_at < now() - interval '24 hours'
        returning encode(token_hash, 'hex') as id
    `);
    await remove("web_sessions", () => tx<Array<{ id: string }>>`
        delete from munch.web_sessions
        where expires_at < now() - interval '7 days'
           or revoked_at < now() - interval '7 days'
        returning encode(token_hash, 'hex') as id
    `);
    await remove("oauth_authorization_sessions", () => tx<Array<{ id: string }>>`
        delete from munch.oauth_authorization_sessions
        where expires_at < now() - interval '24 hours'
        returning id::text
    `);
    await remove("oauth_authorization_codes", () => tx<Array<{ id: string }>>`
        delete from munch.oauth_authorization_codes
        where expires_at < now() - interval '24 hours'
           or consumed_at < now() - interval '24 hours'
        returning encode(code_hash, 'hex') as id
    `);
    await remove("oauth_access_tokens", () => tx<Array<{ id: string }>>`
        delete from munch.oauth_access_tokens
        where expires_at < now() - interval '7 days'
           or revoked_at < now() - interval '7 days'
        returning encode(token_hash, 'hex') as id
    `);
    await remove("oauth_refresh_tokens", () => tx<Array<{ id: string }>>`
        delete from munch.oauth_refresh_tokens
        where expires_at < now() - interval '30 days'
           or revoked_at < now() - interval '30 days'
        returning encode(token_hash, 'hex') as id
    `);
    await remove("meal_drafts_expired", () => tx<Array<{ id: string }>>`
        update munch.meal_drafts
        set status = 'expired', version = version + 1, updated_at = now()
        where expires_at <= now()
          and status in ('open', 'awaiting_answers', 'awaiting_confirmation')
        returning id::text
    `);
    await remove("meal_drafts_deleted", () => tx<Array<{ id: string }>>`
        delete from munch.meal_drafts
        where status in ('cancelled', 'expired')
          and updated_at < now() - interval '30 days'
        returning id::text
    `);
    await remove("export_files", () => tx<Array<{ id: string }>>`
        delete from munch.export_files
        where expires_at <= now()
        returning encode(token_hash, 'hex') as id
    `);
    await remove("food_cache", () => tx<Array<{ id: string }>>`
        delete from munch.food_cache
        where fetched_at < now() - interval '30 days'
        returning source || ':' || source_id as id
    `);
    await remove("tool_events", () => tx<Array<{ id: string }>>`
        delete from munch.tool_events
        where invoked_at < now() - interval '90 days'
        returning id::text
    `);
});

await closePlatformDatabase();
console.log(JSON.stringify({ maintenance: "complete", removed: results }));
