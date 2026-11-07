-- Web dashboard sessions (src/dashboard-auth.ts). One row per signed-in
-- browser: the browser holds the raw `nmds_` cookie value, and only its
-- hashSecret(raw) — lowercase sha256 hex, src/token-hash.ts — is stored here.
--
-- Lifetimes: expires_at is the idle expiry, 7 days after the last use and slid
-- at most hourly (last_seen_at records when), never past absolute_expires_at,
-- which is 30 days after sign-in. A lookup requires both to be in the future;
-- the hourly sweep (src/oauth-cleanup.ts) deletes rows past either.
--
-- No IP, no user agent, no CSRF value (it is derived from the cookie, never
-- stored). created_at, last_seen_at and expires_at are exported in the user's
-- archive (connections.csv); account deletion removes the rows first.
--
-- Only the server (service role) reads or writes this table: RLS is enabled
-- with no policy, and anon/authenticated get no table privileges at all.
--
-- Release order: apply to dev before the code reaches `dev`, and to production
-- before it reaches `main` (merging to main deploys): deleteAllUserData deletes
-- from this table, so without it account deletion fails.
create table if not exists public.dashboard_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    token_hash text not null unique,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    expires_at timestamptz not null,
    absolute_expires_at timestamptz not null,
    check (expires_at <= absolute_expires_at)
);

create index if not exists dashboard_sessions_user_id_idx
    on public.dashboard_sessions (user_id);
create index if not exists dashboard_sessions_expires_at_idx
    on public.dashboard_sessions (expires_at);

alter table public.dashboard_sessions enable row level security;

revoke all on table public.dashboard_sessions from anon, authenticated;
grant all on table public.dashboard_sessions to service_role;
