-- Shared cache of resolved food lookups (Open Food Facts; later USDA). Global,
-- not per-user: a given barcode resolves to the same product for everyone, so a
-- single cached row serves every user. This caps outbound calls to third-party
-- food APIs, cuts latency, and makes repeat logs of the same item instant. The
-- server refreshes a row when it is older than the per-source TTL (src/foods.ts).
create table if not exists public.food_cache (
    source     text        not null,   -- 'openfoodfacts' (later 'usda')
    source_id  text        not null,   -- barcode or food id within that source
    payload    jsonb       not null,   -- normalized FoodResult
    fetched_at timestamptz not null default now(),
    primary key (source, source_id)
);

-- Only the server (service-role) reads or writes the cache; it is never exposed
-- to the anon/authenticated PostgREST roles. RLS is enabled with no policy, so
-- those roles see nothing while the service role bypasses RLS.
alter table public.food_cache enable row level security;

grant all on table public.food_cache to service_role;