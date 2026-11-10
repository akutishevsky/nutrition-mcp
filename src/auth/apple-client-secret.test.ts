import { describe, expect, test } from "bun:test";
import { generateKeyPairSync, verify as cryptoVerify } from "node:crypto";
import {
    APPLE_APP_BUNDLE_IDENTIFIER,
    APPLE_CLIENT_SECRET_LIFETIME_SECONDS,
    generateAppleClientSecret,
    normalizeApplePrivateKey,
} from "./apple-client-secret.js";

const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
});
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });

const FIXTURE = {
    servicesId: "business.munch.signin",
    keyId: "FIXTUREKEY1",
    teamId: "TEAMFIXTURE",
    privateKey: privatePem,
    issuedAtSeconds: 1_700_000_000,
};

function decodeSegment(segment: string): Record<string, unknown> {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

describe("Apple client secret generation (IOS-AUTH)", () => {
    test("produces an ES256 JWT with Apple's required header and claims", () => {
        const secret = generateAppleClientSecret(FIXTURE);
        const [headerSegment, claimsSegment, signatureSegment] =
            secret.split(".");
        expect(decodeSegment(headerSegment!)).toEqual({
            alg: "ES256",
            kid: "FIXTUREKEY1",
            typ: "JWT",
        });
        expect(decodeSegment(claimsSegment!)).toEqual({
            iss: "TEAMFIXTURE",
            iat: 1_700_000_000,
            exp: 1_700_000_000 + APPLE_CLIENT_SECRET_LIFETIME_SECONDS,
            aud: "https://appleid.apple.com",
            sub: "business.munch.signin",
        });
        expect(signatureSegment!.length).toBeGreaterThan(0);
        // The lifetime stays inside Apple's six-month maximum.
        expect(APPLE_CLIENT_SECRET_LIFETIME_SECONDS).toBeLessThanOrEqual(
            15_777_000,
        );
    });

    test("the signature verifies against the key's public half (JWS form)", () => {
        const secret = generateAppleClientSecret(FIXTURE);
        const [headerSegment, claimsSegment, signatureSegment] =
            secret.split(".");
        const valid = cryptoVerify(
            "sha256",
            Buffer.from(`${headerSegment}.${claimsSegment}`),
            { key: publicKey, dsaEncoding: "ieee-p1363" },
            Buffer.from(signatureSegment!, "base64url"),
        );
        expect(valid).toBe(true);
    });

    test("accepts env-style escaped newlines in the key material", () => {
        const escaped = privatePem.replaceAll("\n", "\\n");
        expect(normalizeApplePrivateKey(escaped)).toBe(privatePem);
        const secret = generateAppleClientSecret({
            ...FIXTURE,
            privateKey: escaped,
        });
        expect(secret.split(".")).toHaveLength(3);
    });

    test("refuses unparseable or wrong-curve key material by name", () => {
        expect(() =>
            generateAppleClientSecret({ ...FIXTURE, privateKey: "not-a-key" }),
        ).toThrow(/MUNCH_APPLE_PRIVATE_KEY/);
        const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
        expect(() =>
            generateAppleClientSecret({
                ...FIXTURE,
                privateKey: rsa.privateKey
                    .export({ type: "pkcs8", format: "pem" })
                    .toString(),
            }),
        ).toThrow(/P-256/);
    });

    test("the bundle identifier is the packaged app's audience", () => {
        expect(APPLE_APP_BUNDLE_IDENTIFIER).toBe("business.munch.app");
    });
});
