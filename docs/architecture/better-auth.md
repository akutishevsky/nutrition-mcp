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

## Rollout

`MUNCH_AUTH_BACKEND` remains `custom` until the Better Auth schema, magic-link flow, OAuth 2.1 flow, Stripe continuation, and live ChatGPT connection matrix pass in staging. The feature flag provides a controlled rollback without remapping nutrition or billing records.

## Database rules

- Existing numbered migrations are immutable.
- Better Auth schema changes use additive Munch migrations.
- Runtime Better Auth connections assume the restricted `munch_auth` role.
- Password values are prohibited by a database constraint.
