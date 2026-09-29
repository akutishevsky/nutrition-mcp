-- registered_clients held the redirect URIs of the pre-#148 static OAuth client.
-- Nothing has read or written it since OAuth Phase A (oauth_clients replaced it;
-- the reviewed redirects live on in oauth_legacy_redirect_uris). It was never
-- exported or deleted with an account, so it goes.
drop table if exists public.registered_clients;
