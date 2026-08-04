# Dynamic client registration array-storage incident

On 2026-08-04, ChatGPT reached `POST /api/auth/oauth2/register` successfully, but PostgreSQL returned `22P02 malformed array literal` while Better Auth persisted the default scopes as JSON text.

Migration `0012_better_auth_oauth_provider.sql` modeled OAuth Provider list fields as native PostgreSQL `text[]`. Better Auth's built-in PostgreSQL adapter serializes those plugin `string[]` fields as JSON text. Migration `0013_better_auth_oauth_json_lists.sql` converts every affected OAuth list field to `text` without modifying migration 0012 and preserves existing values by converting native arrays to JSON array text.

CI now performs both column-type validation and a real unauthenticated Better Auth dynamic client registration against `/api/auth/oauth2/register`.
