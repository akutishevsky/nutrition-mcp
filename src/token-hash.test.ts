import { test, expect, describe } from "bun:test";
import { hashSecret, newOpaqueToken, storedFormsOf } from "./token-hash.js";

describe("hashSecret", () => {
    // Must equal Postgres encode(sha256(convert_to('abc','UTF8')),'hex') — the
    // expression the …_hash_oauth_secrets.sql backfill runs over every row
    // written before hashing. If the two ever disagree, every backfilled token
    // stops matching and its owner is logged out.
    test("matches the sha256 vector the backfill's Postgres expression produces", () => {
        expect(hashSecret("abc")).toBe(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        );
    });

    test("hashes UTF-8 bytes, as convert_to(x,'UTF8') does", () => {
        // sha256 of the two UTF-8 bytes c3 a9 ("é"), not of a Latin-1 e9 —
        // `printf 'é' | shasum -a 256` in a UTF-8 shell.
        expect(hashSecret("é")).toBe(
            "4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c",
        );
    });

    test("is lowercase hex, 64 characters", () => {
        expect(hashSecret(newOpaqueToken())).toMatch(/^[0-9a-f]{64}$/);
    });
});

describe("newOpaqueToken", () => {
    test("is 32 random bytes in base64url: 43 characters, no padding", () => {
        const t = newOpaqueToken();
        expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(Buffer.from(t, "base64url")).toHaveLength(32);
    });

    test("never repeats", () => {
        const seen = new Set(Array.from({ length: 1000 }, newOpaqueToken));
        expect(seen.size).toBe(1000);
    });
});

describe("storedFormsOf", () => {
    test("a new token is looked up by its hash only", () => {
        const t = newOpaqueToken();
        expect(storedFormsOf(t)).toEqual([hashSecret(t)]);
    });

    // TODO(oauth-hash-fallback): after the backfill, a UUID resolves by hash only.
    test("a pre-hashing UUID is looked up by its hash and its raw value", () => {
        const uuid = "0f8fad5b-d9cb-469f-a165-70867728950e";
        expect(storedFormsOf(uuid)).toEqual([hashSecret(uuid), uuid]);
    });

    // Presenting a stored hash must never match its own row: that would make
    // a leaked hash as good as the token it stands for.
    test("a value already in hash form is never looked up raw", () => {
        const stored = hashSecret(newOpaqueToken());
        expect(storedFormsOf(stored)).toEqual([hashSecret(stored)]);
    });

    test("caller-controlled text never reaches the query raw", () => {
        for (const v of [
            'a,b"c)',
            "",
            "0F8FAD5B-D9CB-469F-A165-70867728950E",
        ]) {
            expect(storedFormsOf(v)).toEqual([hashSecret(v)]);
        }
    });
});
