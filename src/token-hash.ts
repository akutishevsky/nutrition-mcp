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
