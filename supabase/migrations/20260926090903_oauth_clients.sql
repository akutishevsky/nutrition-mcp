-- Per-client OAuth registration (RFC 7591) replacing the single static env
-- client that /register used to hand every caller (#148). Each client's
-- redirect URIs are enforced at /authorize; a confidential client's secret is
-- stored only as a sha256 hash. auth_codes gains the client and resource the
-- code was issued for, so /token can bind a code to the client redeeming it.
--
-- oauth_legacy_redirect_uris is the hand-reviewed snapshot of redirects the
-- legacy env client may still use until its sunset. Its rows contain
-- per-user and per-connector ids, so they are inserted by hand and never
-- committed.
create table if not exists public.oauth_clients (
    client_id text primary key,
    client_secret_hash text,
    token_endpoint_auth_method text not null check (token_endpoint_auth_method in ('none','client_secret_post','client_secret_basic')),
    redirect_uris text[] not null check (cardinality(redirect_uris) between 1 and 10),
    client_name text,
    grant_types text[] not null default '{authorization_code,refresh_token}',
    created_at timestamptz not null default now(),
    last_used_at timestamptz
);

-- Only the server (service-role) reads or writes these; RLS is enabled with no
-- policy, so the anon/authenticated PostgREST roles see nothing while the
-- service role bypasses RLS. Same pattern as patreon_tokens / oauth_tokens.
alter table public.oauth_clients enable row level security;
grant all on table public.oauth_clients to service_role;

create table if not exists public.oauth_legacy_redirect_uris (
    redirect_uri text primary key,
    added_at timestamptz not null default now()
);
alter table public.oauth_legacy_redirect_uris enable row level security;
grant all on table public.oauth_legacy_redirect_uris to service_role;

alter table public.auth_codes add column if not exists client_id text;
alter table public.auth_codes add column if not exists resource text;
