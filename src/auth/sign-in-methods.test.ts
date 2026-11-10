import { describe, expect, test } from "bun:test";
import type { BetterAuthRuntimeConfig } from "./config.js";
import {
    buildSignInMethods,
    isSignInProviderId,
    lastSignInMethodMessage,
    maskEmailAddress,
    maskProviderAccountId,
    maskedIdentityFromIdToken,
    providerSubjectFromIdToken,
    SIGN_IN_METHOD_CONFLICT_MESSAGE,
    type SignInAccountRow,
} from "./sign-in-methods.js";

function config(
    overrides: Partial<BetterAuthRuntimeConfig> = {},
): BetterAuthRuntimeConfig {
    return {
        baseUrl: "https://munch.example",
        databaseUrl: "postgresql://unused",
        secret: "unused",
        production: false,
        publicPasswordSignup: false,
        magicLinkExpiresIn: 600,
        databasePoolSize: 5,
        ...overrides,
    };
}

const GOOGLE = {
    googleWebClientId: "web-id.apps.googleusercontent.com",
    googleClientSecret: "secret",
};
const APPLE = {
    appleServicesId: "business.munch.signin",
    appleKeyId: "KEY123",
    appleTeamId: "TEAM123",
    applePrivateKey: "unused-private-key",
};

function fakeIdToken(payload: Record<string, unknown>): string {
    const segment = (value: unknown) =>
        Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
    return `${segment({ alg: "RS256", typ: "JWT" })}.${segment(payload)}.signature`;
}

function row(overrides: Partial<SignInAccountRow> = {}): SignInAccountRow {
    return {
        provider_id: "google",
        account_id: "109876543210123456789",
        id_token: null,
        created_at: new Date("2026-01-01T00:00:00Z"),
        ...overrides,
    };
}

describe("identity masking", () => {
    test("emails keep only the first local character and the domain", () => {
        expect(maskEmailAddress("MichaelHMIV@Gmail.com")).toBe(
            "m•••@gmail.com",
        );
        expect(maskEmailAddress("a@example.test")).toBe("a•••@example.test");
        expect(maskEmailAddress("not-an-email")).toBe("•••");
    });

    test("provider account ids keep only the last four characters", () => {
        expect(maskProviderAccountId("109876543210123456789")).toBe("••••6789");
        expect(maskProviderAccountId("abc")).toBe("••••");
    });

    test("an ID token contributes only its masked email claim", () => {
        const token = fakeIdToken({
            sub: "109876543210123456789",
            email: "someone.private@gmail.com",
        });
        expect(maskedIdentityFromIdToken(token)).toBe("s•••@gmail.com");
        expect(maskedIdentityFromIdToken("garbage")).toBeNull();
        expect(maskedIdentityFromIdToken(null)).toBeNull();
        expect(maskedIdentityFromIdToken(fakeIdToken({ sub: "x" }))).toBeNull();
        expect(providerSubjectFromIdToken(token)).toBe("109876543210123456789");
        expect(providerSubjectFromIdToken("garbage")).toBeNull();
    });

    test("no masked form ever contains the full identity", () => {
        const email = "distinctive.address@relay.example";
        expect(maskEmailAddress(email)).not.toContain("distinctive");
        const accountId = "00112233445566778899";
        expect(maskProviderAccountId(accountId)).not.toContain("00112233");
    });
});

describe("sign-in method inventory (Amendment I definition)", () => {
    test("email link is derived state: always linked, never removable, no row needed", () => {
        const methods = buildSignInMethods({
            userEmail: "person@example.test",
            accounts: [],
            config: config(GOOGLE),
        });
        const email = methods.find((method) => method.id === "email")!;
        expect(email.state).toBe("linked");
        expect(email.maskedIdentity).toBe("p•••@example.test");
        expect(email.removable).toBe(false);
        expect(email.canLink).toBe(false);
    });

    test("an unconfigured provider reports not_configured, never an error state", () => {
        const methods = buildSignInMethods({
            userEmail: "person@example.test",
            accounts: [],
            config: config(),
        });
        const google = methods.find((method) => method.id === "google")!;
        expect(google.state).toBe("not_configured");
        expect(google.configured).toBe(false);
        expect(google.canLink).toBe(false);
        const apple = methods.find((method) => method.id === "apple")!;
        expect(apple.state).toBe("not_configured");
    });

    test("a configured but unlinked provider is linkable", () => {
        const methods = buildSignInMethods({
            userEmail: "person@example.test",
            accounts: [],
            config: config({ ...GOOGLE, ...APPLE }),
        });
        for (const id of ["google", "apple"] as const) {
            const method = methods.find((entry) => entry.id === id)!;
            expect(method.state).toBe("not_linked");
            expect(method.canLink).toBe(true);
            expect(method.removable).toBe(false);
            expect(method.maskedIdentity).toBeNull();
        }
    });

    test("a linked provider keys on its account row, not email matching (private-relay safe)", () => {
        // The account email and the provider identity's email differ —
        // the row still makes the method linked, with the PROVIDER's
        // masked identity shown.
        const methods = buildSignInMethods({
            userEmail: "real.inbox@example.test",
            accounts: [
                row({
                    provider_id: "apple",
                    account_id: "001999.abcdef0123456789.1234",
                    id_token: fakeIdToken({
                        sub: "001999.abcdef0123456789.1234",
                        email: "x9k2relay@privaterelay.appleid.com",
                    }),
                }),
            ],
            config: config(APPLE),
        });
        const apple = methods.find((method) => method.id === "apple")!;
        expect(apple.state).toBe("linked");
        expect(apple.maskedIdentity).toBe("x•••@privaterelay.appleid.com");
        expect(apple.removable).toBe(true);
        expect(apple.canLink).toBe(false);
    });

    test("a linked provider without an ID token falls back to the masked account id", () => {
        const methods = buildSignInMethods({
            userEmail: "person@example.test",
            accounts: [row()],
            config: config(GOOGLE),
        });
        const google = methods.find((method) => method.id === "google")!;
        expect(google.state).toBe("linked");
        expect(google.maskedIdentity).toBe("••••6789");
    });

    test("credential rows never appear in the inventory (reviewer login is not a user sign-in method)", () => {
        const methods = buildSignInMethods({
            userEmail: "reviewer@example.test",
            accounts: [
                row({
                    provider_id: "credential",
                    account_id: "reviewer-user-id",
                }),
            ],
            config: config(GOOGLE),
        });
        expect(methods.map((method) => method.id)).toEqual([
            "email",
            "google",
            "apple",
        ]);
        const google = methods.find((method) => method.id === "google")!;
        expect(google.state).toBe("not_linked");
    });

    test("the inventory is always exactly Email link, Google, Apple in order", () => {
        const methods = buildSignInMethods({
            userEmail: "person@example.test",
            accounts: [row(), row({ provider_id: "apple", account_id: "a1" })],
            config: config({ ...GOOGLE, ...APPLE }),
        });
        expect(methods.map((method) => method.id)).toEqual([
            "email",
            "google",
            "apple",
        ]);
        expect(methods.map((method) => method.label)).toEqual([
            "Email link",
            "Google",
            "Apple",
        ]);
    });
});

describe("guardrail vocabulary", () => {
    test("provider ids are exactly the social providers", () => {
        expect(isSignInProviderId("google")).toBe(true);
        expect(isSignInProviderId("apple")).toBe(true);
        expect(isSignInProviderId("email")).toBe(false);
        expect(isSignInProviderId("credential")).toBe(false);
        expect(isSignInProviderId("oauthConsent")).toBe(false);
    });

    test("the conflict and last-method messages are plain and name the remedy", () => {
        expect(SIGN_IN_METHOD_CONFLICT_MESSAGE).toContain(
            "already linked to a different Munch account",
        );
        expect(SIGN_IN_METHOD_CONFLICT_MESSAGE).not.toContain("merge into");
        const last = lastSignInMethodMessage("Google");
        expect(last).toContain("can't unlink Google");
        expect(last).toContain("Link another sign-in method first");
    });
});
