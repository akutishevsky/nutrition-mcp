-- Password authentication is available only for pre-provisioned Better Auth
-- credential accounts. Public password signup remains disabled in runtime
-- configuration; magic-link accounts and OAuth identities cannot store hashes.

alter table munch.auth_accounts
    drop constraint auth_accounts_password_disabled;

alter table munch.auth_accounts
    add constraint auth_accounts_password_scope
    check (
        (provider_id = 'credential' and password is not null)
        or (provider_id <> 'credential' and password is null)
    );

comment on table munch.auth_accounts is
    'Better Auth identities; password hashes are permitted only for provisioned credential accounts';
comment on constraint auth_accounts_password_scope on munch.auth_accounts is
    'Credential identities require a Better Auth password hash; all other providers prohibit password values';
