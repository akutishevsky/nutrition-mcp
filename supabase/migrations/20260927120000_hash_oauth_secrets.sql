-- Hash every OAuth access token, refresh token and authorization code still
-- stored raw, so the token tables hold only sha256 hex at rest (D8).
--
-- ORDER MATTERS. Apply this only AFTER code that writes hashSecret(raw) and
-- still also looks tokens up by their raw value is live in the environment
-- (Phase C, #158; that raw lookup was removed in C2 once dev and production
-- were both backfilled on 2026-09-27). Run against code that looks tokens up
-- raw only, it logs out every connected user; code without the raw lookup,
-- deployed before it, logs out every user with a raw row.
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
-- and only then deploy code without the raw-lookup fallback (C2).
update public.oauth_tokens   set token = encode(sha256(convert_to(token,'UTF8')),'hex') where token !~ '^[0-9a-f]{64}$';
update public.refresh_tokens set token = encode(sha256(convert_to(token,'UTF8')),'hex') where token !~ '^[0-9a-f]{64}$';
update public.auth_codes     set code  = encode(sha256(convert_to(code ,'UTF8')),'hex') where code  !~ '^[0-9a-f]{64}$';

comment on column public.oauth_tokens.token is
    'sha256 hex (lowercase) of the access token; the raw token is never stored. Matches hashSecret() in src/token-hash.ts.';
comment on column public.refresh_tokens.token is
    'sha256 hex (lowercase) of the refresh token; the raw token is never stored. Matches hashSecret() in src/token-hash.ts.';
comment on column public.auth_codes.code is
    'sha256 hex (lowercase) of the authorization code; the raw code is never stored. Matches hashSecret() in src/token-hash.ts.';
