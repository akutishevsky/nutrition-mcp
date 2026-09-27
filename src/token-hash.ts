// The at-rest form of every OAuth secret this server issues — access tokens,
// refresh tokens, authorization codes and client secrets — and how new ones
// are minted. Deliberately free of any Supabase import, so src/oauth.test.ts's
// fake store can apply the exact same contract the real one does.
import crypto from "node:crypto";

// Lowercase sha256 hex of the UTF-8 bytes. Must agree byte for byte with the
// Postgres expression the backfill migration (…_hash_oauth_secrets.sql) runs
// over rows written before hashing: encode(sha256(convert_to(x,'UTF8')),'hex').
// If the two ever disagree, every backfilled token stops matching and its
// owner is logged out.
export function hashSecret(raw: string): string {
    return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

// 32 random bytes, base64url: 43 characters, no padding. The raw value is
// handed to the client once and only hashSecret(raw) is ever stored.
export function newOpaqueToken(): string {
    return crypto.randomBytes(32).toString("base64url");
}

// Every token and code written before hashing was a crypto.randomUUID().
const LEGACY_RAW =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// The values a presented token or code may be stored under: its hash, which
// is every row written since hashing began, and — only while the backfill has
// not yet rewritten the older rows — the raw value itself.
//
// The raw half is limited to the UUID shape every pre-hashing value had. That
// is not just tidiness: accepting any raw value would let someone who read a
// stored hash (a leaked backup, say) present the hash itself and have it match
// its own row, which is exactly what storing hashes is meant to prevent. It
// also keeps caller-controlled text out of the PostgREST `in (…)` filter.
export function storedFormsOf(raw: string): string[] {
    const forms = [hashSecret(raw)];
    // TODO(oauth-hash-fallback): remove after backfill
    if (LEGACY_RAW.test(raw)) forms.push(raw);
    return forms;
}
