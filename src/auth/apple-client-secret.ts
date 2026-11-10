import { createPrivateKey, sign as cryptoSign } from "node:crypto";

/**
 * Sign in with Apple client secret (IOS-AUTH, Amendment H).
 *
 * Apple does not issue a static client secret. The secret Better Auth's
 * Apple provider presents to Apple's token endpoint is a short-lived JWT
 * the server signs itself with the Sign-in-with-Apple `.p8` key:
 *
 * - header: `alg: "ES256"`, `kid` = the key ID, `typ: "JWT"`
 * - claims: `iss` = the Apple team ID, `sub` = the Services ID,
 *   `aud` = `https://appleid.apple.com`, `iat`/`exp` bounding the
 *   lifetime (Apple rejects lifetimes over six months)
 * - signature: ES256 (ECDSA P-256 + SHA-256, JWS `ieee-p1363` encoding)
 *
 * `MUNCH_APPLE_PRIVATE_KEY` holds the `.p8` contents — never a
 * pre-generated secret — and the JWT is generated when the provider is
 * registered (once per auth-instance/process start, in
 * `appleProviderOptions`). A process that outlives the lifetime below
 * must be restarted to mint a fresh one; Railway restarts on every
 * deploy, and the lifetime is sized far beyond any deploy cadence.
 */

/** The packaged app's bundle ID (Capacitor `appId`, also the AASA appID
 * suffix and the iOS distribution profile's application-identifier). A
 * native Sign in with Apple flow presents ID tokens whose audience is
 * this bundle ID, never the Services ID. */
export const APPLE_APP_BUNDLE_IDENTIFIER = "business.munch.app";

export const APPLE_TOKEN_AUDIENCE = "https://appleid.apple.com";

/** 180 days — inside Apple's six-month maximum (15,777,000 seconds). */
export const APPLE_CLIENT_SECRET_LIFETIME_SECONDS = 180 * 24 * 60 * 60;

function base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
}

/**
 * Env-carried key material commonly arrives with literal `\n` escapes
 * instead of newlines (single-line env entry); normalize before parsing
 * so the same value works entered either way.
 */
export function normalizeApplePrivateKey(raw: string): string {
    return raw.includes("\\n") ? raw.replaceAll("\\n", "\n") : raw.trim();
}

export interface AppleClientSecretInput {
    servicesId: string;
    keyId: string;
    teamId: string;
    privateKey: string;
    /** Issuance time; injectable for tests. Defaults to now. */
    issuedAtSeconds?: number;
    /** Lifetime in seconds; defaults to APPLE_CLIENT_SECRET_LIFETIME_SECONDS. */
    lifetimeSeconds?: number;
}

export function generateAppleClientSecret(
    input: AppleClientSecretInput,
): string {
    const issuedAt = input.issuedAtSeconds ?? Math.floor(Date.now() / 1000);
    const lifetime =
        input.lifetimeSeconds ?? APPLE_CLIENT_SECRET_LIFETIME_SECONDS;
    if (
        !Number.isInteger(issuedAt) ||
        !Number.isInteger(lifetime) ||
        lifetime <= 0 ||
        lifetime > 15_777_000
    ) {
        throw new Error(
            "Apple client secret lifetime must be a positive integer within Apple's six-month maximum",
        );
    }

    let key;
    try {
        key = createPrivateKey(normalizeApplePrivateKey(input.privateKey));
    } catch {
        throw new Error(
            "MUNCH_APPLE_PRIVATE_KEY is not a parseable private key (expected the Sign in with Apple .p8 contents)",
        );
    }
    // Node names the curve "P-256"; some runtimes report the same curve
    // by its OpenSSL name "prime256v1". Both are the one Apple curve.
    const namedCurve = key.asymmetricKeyDetails?.namedCurve;
    if (
        key.asymmetricKeyType !== "ec" ||
        (namedCurve !== "P-256" && namedCurve !== "prime256v1")
    ) {
        throw new Error(
            "MUNCH_APPLE_PRIVATE_KEY must be an EC P-256 key (the Sign in with Apple .p8 format)",
        );
    }

    const header = { alg: "ES256", kid: input.keyId, typ: "JWT" };
    const claims = {
        iss: input.teamId,
        iat: issuedAt,
        exp: issuedAt + lifetime,
        aud: APPLE_TOKEN_AUDIENCE,
        sub: input.servicesId,
    };
    const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
    const signature = cryptoSign("sha256", Buffer.from(signingInput), {
        key,
        dsaEncoding: "ieee-p1363",
    });
    return `${signingInput}.${base64Url(signature)}`;
}
