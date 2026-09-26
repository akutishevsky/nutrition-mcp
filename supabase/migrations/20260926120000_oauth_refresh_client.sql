-- Binds each refresh token to the OAuth client it was issued to, so /token can
-- refuse a refresh token presented by any other client. Rows written before
-- this column existed stay null, and /token accepts a null-client refresh
-- token from any client, so nobody already connected is logged out.
--
-- Apply this BEFORE the code that reads it deploys to the same environment:
-- consumeRefreshToken selects client_id, so without the column every refresh
-- fails (every client is logged out) and storeRefreshToken's insert fails the
-- authorization_code grant.
alter table public.refresh_tokens add column if not exists client_id text;
