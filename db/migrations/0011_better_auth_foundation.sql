-- Better Auth shadow schema. The existing munch.users UUID remains the stable
-- domain identity referenced by nutrition, billing, exports, and deletion.
-- Runtime access is restricted to munch_auth; no password provider is enabled.

alter table munch.users
    add column if not exists name text not null default 'Munch user',
    add column if not exists email_verified boolean not null default false,
    add column if not exists image text;

update munch.users
set email_verified = true
where email_verified_at is not null
  and email_verified = false;

create table munch.auth_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    token text not null unique,
    expires_at timestamptz not null,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index auth_sessions_user_expires_idx
    on munch.auth_sessions (user_id, expires_at desc);

create table munch.auth_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    account_id text not null,
    provider_id text not null,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamptz,
    refresh_token_expires_at timestamptz,
    scope text,
    password text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint auth_accounts_provider_identity_unique
        unique (provider_id, account_id),
    constraint auth_accounts_password_disabled check (password is null)
);

create index auth_accounts_user_idx on munch.auth_accounts (user_id);

create table munch.auth_verifications (
    id uuid primary key default gen_random_uuid(),
    identifier text not null,
    value text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index auth_verifications_identifier_idx
    on munch.auth_verifications (identifier, expires_at desc);

alter table munch.auth_sessions enable row level security;
alter table munch.auth_sessions force row level security;
alter table munch.auth_accounts enable row level security;
alter table munch.auth_accounts force row level security;
alter table munch.auth_verifications enable row level security;
alter table munch.auth_verifications force row level security;

create policy auth_sessions_auth_all
    on munch.auth_sessions
    for all
    to munch_auth
    using (true)
    with check (true);

create policy auth_accounts_auth_all
    on munch.auth_accounts
    for all
    to munch_auth
    using (true)
    with check (true);

create policy auth_verifications_auth_all
    on munch.auth_verifications
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on
    munch.auth_sessions,
    munch.auth_accounts,
    munch.auth_verifications
    to munch_auth;

comment on table munch.auth_sessions is
    'Better Auth browser sessions; active only when MUNCH_AUTH_BACKEND=better_auth';
comment on table munch.auth_accounts is
    'Better Auth linked identities; password values are prohibited by constraint';
comment on table munch.auth_verifications is
    'Better Auth hashed single-use verification records for magic-link authentication';
