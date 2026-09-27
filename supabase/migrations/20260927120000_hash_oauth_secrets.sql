-- Hash every OAuth access token, refresh token and authorization code still
-- stored raw, so the token tables hold only sha256 hex at rest (D8).
--
-- ORDER MATTERS. Apply this only AFTER the code that writes hashSecret(raw) and
-- looks up both the hash and the raw value (src/token-hash.ts storedFormsOf)
-- is live in the environment. Run against code that still looks tokens up raw,
-- it logs out every connected user: their token becomes a hash no lookup
-- matches.
--
-- The expression must equal src/token-hash.ts hashSecret() byte for byte —
-- lowercase sha256 hex of the UTF-8 bytes (src/token-hash.test.ts pins the
-- shared vector: 'abc' -> ba7816bf…15ad). Rows already in hash form are left
-- alone, so re-running this is a no-op.
--
-- Afterwards, verify each count is 0:
--   select count(*) from public.oauth_tokens   where token !~ '^[0-9a-f]{64}$';
--   select count(*) from public.refresh_tokens where token !~ '^[0-9a-f]{64}$';
--   select count(*) from public.auth_codes     where code  !~ '^[0-9a-f]{64}$';
-- and only then remove the raw-lookup fallback (TODO(oauth-hash-fallback)).
update public.oauth_tokens   set token = encode(sha256(convert_to(token,'UTF8')),'hex') where token !~ '^[0-9a-f]{64}$';
update public.refresh_tokens set token = encode(sha256(convert_to(token,'UTF8')),'hex') where token !~ '^[0-9a-f]{64}$';
update public.auth_codes     set code  = encode(sha256(convert_to(code ,'UTF8')),'hex') where code  !~ '^[0-9a-f]{64}$';

comment on column public.oauth_tokens.token is
    'sha256 hex (lowercase) of the access token; the raw token is never stored. Matches hashSecret() in src/token-hash.ts.';
comment on column public.refresh_tokens.token is
    'sha256 hex (lowercase) of the refresh token; the raw token is never stored. Matches hashSecret() in src/token-hash.ts.';
comment on column public.auth_codes.code is
    'sha256 hex (lowercase) of the authorization code; the raw code is never stored. Matches hashSecret() in src/token-hash.ts.';
