-- Munch platform foundation for Railway PostgreSQL.
--
-- This migration intentionally creates account, authentication, OAuth, billing,
-- entitlement, and administrative metadata only. Nutrition tables are ported in
-- a later migration after the repository abstraction is in place.

create extension if not exists pgcrypto;

create schema if not exists munch;

-- Privilege-group roles. They are NOLOGIN roles: Railway's database owner
-- connects through DATABASE_URL and SET ROLE narrows each transaction to the
-- minimum capability required by that request path.
do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'munch_app') then
        create role munch_app nologin nosuperuser nocreatedb nocreaterole noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'munch_auth') then
        create role munch_auth nologin nosuperuser nocreatedb nocreaterole noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'munch_billing') then
        create role munch_billing nologin nosuperuser nocreatedb nocreaterole noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'munch_support') then
        create role munch_support nologin nosuperuser nocreatedb nocreaterole noinherit;
    end if;

    execute format('grant munch_app, munch_auth, munch_billing, munch_support to %I', current_user);
end
$$;

revoke all on schema munch from public;
grant usage on schema munch to munch_app, munch_auth, munch_billing, munch_support;

create type munch.account_status as enum (
    'pending',
    'active',
    'suspended',
    'deletion_pending',
    'deleted'
);

create type munch.subscription_status as enum (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

create type munch.login_token_purpose as enum (
    'sign_in',
    'verify_email',
    'change_email'
);

create type munch.audit_actor_type as enum (
    'user',
    'system',
    'support',
    'billing',
    'migration'
);

create table munch.users (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    email_verified_at timestamptz,
    status munch.account_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deletion_requested_at timestamptz,
    deleted_at timestamptz,
    constraint users_email_normalized check (email = lower(btrim(email))),
    constraint users_email_nonempty check (length(email) between 3 and 320)
);

create unique index users_email_unique on munch.users (email);

create table munch.account_preferences (
    user_id uuid primary key references munch.users(id) on delete cascade,
    timezone text,
    preferred_weight_unit text check (preferred_weight_unit in ('kg', 'lb')),
    widgets_enabled boolean not null default true,
    alcohol_tracking_enabled boolean not null default false,
    preferred_drink_unit text check (preferred_drink_unit in ('us', 'uk')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table munch.login_tokens (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    user_id uuid references munch.users(id) on delete cascade,
    purpose munch.login_token_purpose not null,
    token_hash bytea not null unique,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now(),
    constraint login_tokens_email_normalized check (email = lower(btrim(email)))
);

create index login_tokens_lookup_idx
    on munch.login_tokens (email, purpose, expires_at desc)
    where consumed_at is null;

create table munch.web_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    token_hash bytea not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

create index web_sessions_user_idx on munch.web_sessions (user_id, expires_at desc);

create table munch.oauth_clients (
    client_id text primary key,
    client_secret_hash bytea,
    client_name text,
    redirect_uris text[] not null,
    token_endpoint_auth_method text not null default 'none',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint oauth_clients_redirect_uris_nonempty check (cardinality(redirect_uris) > 0),
    constraint oauth_clients_auth_method check (
        token_endpoint_auth_method in ('none', 'client_secret_post', 'client_secret_basic')
    )
);

create table munch.oauth_authorization_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references munch.users(id) on delete cascade,
    client_id text not null references munch.oauth_clients(client_id) on delete cascade,
    redirect_uri text not null,
    state_hash bytea not null,
    code_challenge text not null,
    code_challenge_method text not null default 'S256',
    stripe_checkout_session_id text,
    expires_at timestamptz not null,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    constraint oauth_authorization_sessions_pkce check (code_challenge_method = 'S256')
);

create index oauth_authorization_sessions_expiry_idx
    on munch.oauth_authorization_sessions (expires_at)
    where completed_at is null;

create table munch.oauth_authorization_codes (
    code_hash bytea primary key,
    user_id uuid not null references munch.users(id) on delete cascade,
    client_id text not null references munch.oauth_clients(client_id) on delete cascade,
    redirect_uri text not null,
    code_challenge text not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
);

create table munch.oauth_access_tokens (
    token_hash bytea primary key,
    user_id uuid not null references munch.users(id) on delete cascade,
    client_id text not null references munch.oauth_clients(client_id) on delete cascade,
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now()
);

create index oauth_access_tokens_user_idx
    on munch.oauth_access_tokens (user_id, expires_at desc);

create table munch.oauth_refresh_tokens (
    token_hash bytea primary key,
    token_family_id uuid not null,
    user_id uuid not null references munch.users(id) on delete cascade,
    client_id text not null references munch.oauth_clients(client_id) on delete cascade,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    revoked_at timestamptz,
    replaced_by_hash bytea,
    created_at timestamptz not null default now()
);

create index oauth_refresh_tokens_family_idx
    on munch.oauth_refresh_tokens (token_family_id, created_at desc);

create table munch.stripe_customers (
    user_id uuid primary key references munch.users(id) on delete cascade,
    stripe_customer_id text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table munch.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    stripe_subscription_id text not null unique,
    stripe_price_id text,
    status munch.subscription_status not null,
    current_period_start timestamptz,
    current_period_end timestamptz,
    trial_end timestamptz,
    cancel_at_period_end boolean not null default false,
    canceled_at timestamptz,
    grace_expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on munch.subscriptions (user_id, updated_at desc);
create index subscriptions_status_idx on munch.subscriptions (status, current_period_end);

create table munch.entitlements (
    user_id uuid not null references munch.users(id) on delete cascade,
    feature_key text not null,
    active boolean not null,
    expires_at timestamptz,
    source text not null default 'stripe',
    updated_at timestamptz not null default now(),
    primary key (user_id, feature_key)
);

create table munch.stripe_webhook_events (
    stripe_event_id text primary key,
    event_type text not null,
    livemode boolean not null,
    payload_sha256 text not null,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    processing_error_code text,
    attempts integer not null default 0
);

create table munch.audit_events (
    id bigint generated always as identity primary key,
    occurred_at timestamptz not null default now(),
    actor_type munch.audit_actor_type not null,
    actor_id uuid,
    subject_user_id uuid,
    action text not null,
    outcome text not null,
    request_id text,
    metadata jsonb not null default '{}'::jsonb,
    constraint audit_events_outcome check (outcome in ('success', 'denied', 'failed'))
);

create index audit_events_subject_idx on munch.audit_events (subject_user_id, occurred_at desc);
create index audit_events_action_idx on munch.audit_events (action, occurred_at desc);

-- User context helper used by every user-owned RLS policy.
create or replace function munch.current_user_id()
returns uuid
language sql
stable
as $$
    select nullif(current_setting('app.user_id', true), '')::uuid
$$;

alter table munch.users enable row level security;
alter table munch.users force row level security;
alter table munch.account_preferences enable row level security;
alter table munch.account_preferences force row level security;

create policy users_app_self
    on munch.users
    for select
    to munch_app
    using (id = munch.current_user_id());

create policy users_auth_all
    on munch.users
    for all
    to munch_auth
    using (true)
    with check (true);

create policy users_billing_all
    on munch.users
    for select
    to munch_billing
    using (true);

create policy account_preferences_app_self
    on munch.account_preferences
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy account_preferences_auth_all
    on munch.account_preferences
    for all
    to munch_auth
    using (true)
    with check (true);

-- Base grants. RLS remains the row filter for user-owned tables.
grant select on munch.users to munch_app;
grant select, insert, update on munch.account_preferences to munch_app;

grant select, insert, update, delete on
    munch.users,
    munch.account_preferences,
    munch.login_tokens,
    munch.web_sessions,
    munch.oauth_clients,
    munch.oauth_authorization_sessions,
    munch.oauth_authorization_codes,
    munch.oauth_access_tokens,
    munch.oauth_refresh_tokens
    to munch_auth;

grant select on munch.users to munch_billing;
grant select, insert, update, delete on
    munch.stripe_customers,
    munch.subscriptions,
    munch.entitlements,
    munch.stripe_webhook_events
    to munch_billing;

grant insert on munch.audit_events to munch_app, munch_auth, munch_billing;
grant usage, select on all sequences in schema munch to munch_app, munch_auth, munch_billing;

-- Support receives a deliberately narrow view, not base-table access.
create view munch.support_accounts as
select
    u.id as user_id,
    u.status as account_status,
    u.email_verified_at is not null as email_verified,
    u.created_at,
    u.deletion_requested_at,
    s.status as subscription_status,
    s.current_period_end,
    s.cancel_at_period_end
from munch.users u
left join lateral (
    select sub.status, sub.current_period_end, sub.cancel_at_period_end
    from munch.subscriptions sub
    where sub.user_id = u.id
    order by sub.updated_at desc
    limit 1
) s on true;

grant select on munch.support_accounts to munch_support;

comment on schema munch is 'Munch account, authentication, billing, and application data';
comment on table munch.stripe_webhook_events is 'Idempotency ledger; raw Stripe payloads are not retained';
comment on table munch.audit_events is 'Sanitized operational audit events; never store nutrition contents or secrets';
