-- Persist the client state value so an authorization flow can return it after a
-- passwordless login or Stripe checkout redirect. The hash remains useful for
-- integrity comparisons and operational diagnostics without logging the value.
alter table munch.oauth_authorization_sessions
    add column if not exists state_value text;

update munch.oauth_authorization_sessions
set state_value = ''
where state_value is null;

alter table munch.oauth_authorization_sessions
    alter column state_value set not null;

alter table munch.oauth_authorization_sessions
    add column if not exists authorized_at timestamptz;

alter table munch.oauth_authorization_sessions
    add column if not exists denied_at timestamptz;

alter table munch.oauth_authorization_sessions
    add constraint oauth_authorization_sessions_terminal_state_check
    check (
        num_nonnulls(completed_at, denied_at) <= 1
    );

alter table munch.oauth_authorization_codes
    add column if not exists issued_from_session_id uuid
        references munch.oauth_authorization_sessions(id) on delete set null;

alter table munch.oauth_access_tokens
    add column if not exists token_family_id uuid;

create index if not exists oauth_access_tokens_family_idx
    on munch.oauth_access_tokens (token_family_id)
    where token_family_id is not null;

create unique index if not exists oauth_authorization_codes_live_session_unique
    on munch.oauth_authorization_codes (issued_from_session_id)
    where issued_from_session_id is not null and consumed_at is null;

comment on column munch.oauth_authorization_sessions.state_value is
    'OAuth client state returned verbatim after authorization; never log it';
comment on column munch.oauth_access_tokens.token_family_id is
    'Links access tokens to a rotating refresh-token family for revocation';
