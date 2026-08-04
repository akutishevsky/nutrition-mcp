-- Align Better Auth OAuth Provider list storage with the built-in PostgreSQL
-- adapter. The plugin's string[] fields are serialized as JSON text before
-- persistence; native PostgreSQL text[] columns reject those values as malformed
-- array literals during dynamic client registration.
--
-- Preserve any existing rows by converting native arrays to their equivalent
-- JSON array text. Migration 0012 remains immutable.

alter table munch."oauthClient"
    drop constraint if exists oauth_client_redirect_uris_nonempty;

alter table munch."oauthClient"
    alter column scopes type text
        using case when scopes is null then null else to_json(scopes)::text end,
    alter column contacts type text
        using case when contacts is null then null else to_json(contacts)::text end,
    alter column "redirectUris" type text
        using to_json("redirectUris")::text,
    alter column "postLogoutRedirectUris" type text
        using case
            when "postLogoutRedirectUris" is null then null
            else to_json("postLogoutRedirectUris")::text
        end,
    alter column "grantTypes" type text
        using case
            when "grantTypes" is null then null
            else to_json("grantTypes")::text
        end,
    alter column "responseTypes" type text
        using case
            when "responseTypes" is null then null
            else to_json("responseTypes")::text
        end,
    alter column resources type text
        using case
            when resources is null then null
            else to_json(resources)::text
        end;

alter table munch."oauthRefreshToken"
    alter column scopes type text using to_json(scopes)::text;

alter table munch."oauthAccessToken"
    alter column scopes type text using to_json(scopes)::text;

alter table munch."oauthConsent"
    alter column scopes type text using to_json(scopes)::text;

alter table munch."oauthClient"
    add constraint oauth_client_redirect_uris_json_nonempty
    check (
        jsonb_typeof("redirectUris"::jsonb) = 'array'
        and jsonb_array_length("redirectUris"::jsonb) > 0
    );

comment on column munch."oauthClient".scopes is
    'JSON array text managed by Better Auth OAuth Provider';
comment on column munch."oauthClient"."redirectUris" is
    'JSON array text managed by Better Auth OAuth Provider';
comment on column munch."oauthRefreshToken".scopes is
    'JSON array text managed by Better Auth OAuth Provider';
comment on column munch."oauthAccessToken".scopes is
    'JSON array text managed by Better Auth OAuth Provider';
comment on column munch."oauthConsent".scopes is
    'JSON array text managed by Better Auth OAuth Provider';
