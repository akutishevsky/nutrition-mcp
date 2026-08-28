-- Persists the Patreon creator's OAuth access/refresh token pair across
-- restarts so recent-post fetches for the landing page don't require a fresh
-- manual authorization each deploy. Single campaign, single row.
create table if not exists public.patreon_tokens (
    id            text        primary key default 'default',
    access_token  text        not null,
    refresh_token text        not null,
    expires_at    timestamptz not null,
    updated_at    timestamptz not null default now()
);

-- Only the server (service-role) reads or writes this; it is never exposed to
-- the anon/authenticated PostgREST roles. RLS is enabled with no policy, so
-- those roles see nothing while the service role bypasses RLS. Copies the
-- food_cache / oauth_tokens pattern exactly.
alter table public.patreon_tokens enable row level security;

grant all on table public.patreon_tokens to service_role;
