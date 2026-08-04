# Better Auth boundary

Munch uses Better Auth for browser identity, magic-link authentication, and the OAuth authorization-server lifecycle used by ChatGPT and other MCP clients.

The stable business identity remains `munch.users.id`. Nutrition rows, Stripe customers and subscriptions, preferences, exports, deletion, and audit ownership continue to reference that UUID. Better Auth is an authentication implementation, not the owner of Munch business data.

## Launch authentication

- Magic links only
- Automatic signup for a previously unseen normalized email
- No email/password provider
- No password-reset endpoints
- No social providers at launch
- Hashed, atomically consumed verification tokens
- Scanner-safe confirmation before a link is redeemed
- Direct transactional delivery through the Resend Emails API

## Production rollout

`main` is the production release branch. GitHub CI validates every pull request and push to `main`; Railway watches `main` and deploys merged commits automatically.

Better Auth requires `RESEND_API_KEY`, a verified `MUNCH_EMAIL_FROM` sender, Stripe API and webhook credentials, USDA credentials, PostgreSQL, and the existing Better Auth secret. The Resend API key is server-only and must never be returned to the browser or written to application logs. Keep `MUNCH_AUTH_BACKEND=custom` until those production values are complete. The custom backend remains the rollback value without remapping nutrition or billing records.

## Database rules

- Existing numbered migrations are immutable.
- Better Auth schema changes use additive Munch migrations.
- Runtime Better Auth connections assume the restricted `munch_auth` role.
- Password values are prohibited by a database constraint.
