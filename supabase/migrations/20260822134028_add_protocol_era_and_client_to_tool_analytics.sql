-- Which MCP protocol era served each tool call, and which client made it.
--
-- /mcp serves 2025-11-25 and 2026-07-28 from one endpoint, and retiring the
-- legacy leg is a one-word change (`legacy: "stateless"` -> `"reject"` in
-- createMcpHandler). The hard part is knowing WHEN that stops breaking people,
-- and the runtime access log cannot answer it: at production volume it is a
-- ring buffer holding well under an hour, while the window that matters is 30
-- days — long enough to include someone who logs a meal once a week.
--
-- The gate this exists to serve:
--
--     select count(distinct user_id)
--     from public.tool_analytics
--     where protocol_era = 'legacy'
--       and invoked_at > now() - interval '30 days';
--
-- Distinct USERS, not requests: the number that matters is how many people a
-- flip would break, and the only acceptable answer is zero.
--
-- Additive and nullable, so this is safe on the populated table: no existing
-- row is rewritten or invalidated (NULL passes the check), and every current
-- write path keeps working before the server that knows about these columns
-- ships. Migration first, server second — the reverse order is what breaks.

-- NULL is a real state here and means "not recorded", never "modern". Rows
-- written before this migration have no era, and a request refused before the
-- SDK builds a server (the 415 Content-Type gate, a header/body mismatch)
-- never resolves one either. Counting NULL as anything but unknown would
-- corrupt the very number above.
alter table public.tool_analytics
    add column if not exists protocol_era varchar,
    add column if not exists client_name varchar;

-- Two real values and nothing else. The column is read by a decision that
-- breaks users when it is wrong, so a typo'd era must fail the insert rather
-- than quietly sit in the table and undercount the legacy side.
alter table public.tool_analytics
    drop constraint if exists tool_analytics_protocol_era_check;

alter table public.tool_analytics
    add constraint tool_analytics_protocol_era_check
    check (protocol_era is null or protocol_era in ('legacy', 'modern'));

-- Partial index, not a plain one. The retirement question is only ever asked
-- about legacy rows, so indexing just those keeps the gate query an index scan
-- instead of a sequential scan over the whole table — and, unlike a full index,
-- this one SHRINKS toward nothing as the era dies out rather than growing with
-- every modern call written after it.
create index if not exists tool_analytics_legacy_era_invoked_at_idx
    on public.tool_analytics (invoked_at desc)
    where protocol_era = 'legacy';

-- On client_name, so a later reader is not puzzled by the gaps: it is present
-- on every modern call, because the 2026-era envelope re-sends clientInfo with
-- each request, but on the legacy leg only `initialize` carries it. That leg is
-- stateless and builds a fresh server per request, so a legacy TOOL CALL is a
-- separate request that never saw the identity and records NULL. The era is the
-- load-bearing field; the name is a bonus that says which client to chase.
