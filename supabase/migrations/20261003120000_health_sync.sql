-- Apple Health sync via an iOS Shortcut. Three server-only tables:
--
-- health_sync_pending — one row per "connect" started from the Shortcut
--   (POST /api/v1/health-sync/start), alive for 30 minutes. It carries the
--   hashed connect id (the link opened on the phone), the hashed device secret
--   the Shortcut kept, and the PKCE verifier of the server's own sign-in as a
--   first-party OAuth client. Once the browser finishes sign-in the row gains
--   user_id and a hashed claim code good for 10 minutes; the Shortcut redeems
--   claim code + device secret together, which deletes the row.
-- health_sync_links — at most one per user: the hashed `nmhs_` bearer token
--   the Shortcut syncs with, sliding 90-day expiry capped at 365 days from
--   created_at, and a short lease so two syncs can't run at once.
-- health_sync_days — what was sent to Apple Health per local date, kept for
--   8 days so a later sync tops up instead of re-sending, and exported in the
--   user's archive (health_sync.csv).
--
-- Every secret (connect id, device secret, claim code, link token) is stored
-- only as hashSecret(raw) — lowercase sha256 hex, src/token-hash.ts. The PKCE
-- verifier is the one exception: the server computes the challenge from it
-- and presents it at its own code exchange, so it cannot be hashed; it is
-- single-use, cleared when the claim code is minted, and gone with the row.
--
-- Only the server (service role) reads or writes these: RLS is enabled with
-- no policy, and anon/authenticated get no table privileges at all.
--
-- Release order: apply to dev before the code reaches `dev`, and to production
-- before it reaches `main` (merging to main deploys).
create table if not exists public.health_sync_pending (
    id uuid primary key default gen_random_uuid(),
    connect_id_hash text not null unique,
    device_secret_hash text not null,
    pkce_verifier text,
    fields text[] not null,
    tz text,
    backfill_days integer not null default 0
        check (backfill_days between 0 and 7),
    user_id uuid references auth.users(id) on delete cascade,
    claim_code_hash text unique,
    claim_expires_at timestamptz,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create table if not exists public.health_sync_links (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    token_hash text not null unique,
    kind text not null default 'shortcut' check (kind in ('shortcut')),
    fields text[] not null,
    fallback_tz text,
    sync_start_date date not null,
    lease_until timestamptz,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    last_sync_at timestamptz,
    expires_at timestamptz not null
);

create table if not exists public.health_sync_days (
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,
    timezone text not null,
    -- null until the initial entry for the day is acknowledged.
    sent_values jsonb,
    topup_seq integer not null default 0,
    offer_count integer not null default 0,
    notified jsonb not null default '{}'::jsonb,
    first_sent_at timestamptz,
    last_sent_at timestamptz,
    primary key (user_id, date)
);

alter table public.health_sync_pending enable row level security;
alter table public.health_sync_links enable row level security;
alter table public.health_sync_days enable row level security;

revoke all on table public.health_sync_pending from anon, authenticated;
revoke all on table public.health_sync_links from anon, authenticated;
revoke all on table public.health_sync_days from anon, authenticated;

grant all on table public.health_sync_pending to service_role;
grant all on table public.health_sync_links to service_role;
grant all on table public.health_sync_days to service_role;
