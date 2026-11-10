import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { bearer, jwt, magicLink, username } from "better-auth/plugins";
import { createHash, randomBytes } from "node:crypto";
import { Pool } from "pg";
import { betterAuthTrustedOrigins } from "../mobile/origins.js";
import { getBetterAuthRuntimeConfig } from "./config.js";
import {
    sendBetterAuthMagicLink,
    sendBetterAuthPasswordReset,
    sendBetterAuthVerificationEmail,
} from "./email.js";
import { buildScannerSafeMagicLink } from "./magic-link-url.js";
import {
    MUNCH_DEFAULT_OAUTH_SCOPES,
    MUNCH_OAUTH_SCOPES,
    munchMcpResourceUrl,
} from "./oauth-scopes.js";
import {
    appleProviderOptions,
    appleSignInConfigured,
    googleProviderClientIds,
} from "./social-sign-in.js";

const MOBILE_HANDOFF_IDENTIFIER_PREFIX = "munch-mobile-handoff:";
const MOBILE_HANDOFF_TTL_MS = 2 * 60 * 1000;

let authDatabase: Pool | null = null;

function sha256Base64Url(value: string): string {
    return createHash("sha256").update(value).digest("base64url");
}

function getAuthDatabase(): Pool {
    if (!authDatabase) getMunchBetterAuth();
    if (!authDatabase) throw new Error("Better Auth database is unavailable");
    return authDatabase;
}

function validMobileCodeChallenge(value: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(value);
}

function validMobileCodeVerifier(value: string): boolean {
    return /^[A-Za-z0-9._~-]{43,128}$/.test(value);
}

function createMunchBetterAuth() {
    const config = getBetterAuthRuntimeConfig();
    const reviewerSeedMode = process.env.MUNCH_REVIEWER_SEED_MODE === "true";
    const passwordSignupEnabled =
        reviewerSeedMode || config.publicPasswordSignup;
    const database = new Pool({
        connectionString: config.databaseUrl,
        max: config.databasePoolSize,
        idleTimeoutMillis: 20_000,
        connectionTimeoutMillis: 10_000,
        application_name: "munch-better-auth",
        options: "-c search_path=munch,public -c role=munch_auth",
    });
    authDatabase = database;

    const googleClientIds = googleProviderClientIds(config);

    // Sign in with Apple (IOS-AUTH): registered only when the full
    // MUNCH_APPLE_* set is configured — otherwise the provider is absent
    // and behaviour is byte-for-byte the pre-IOS-AUTH instance. The
    // options builder owns the audience pair (Services ID for web,
    // bundle ID for the packaged app) and the generated client secret.
    const appleOptions = appleProviderOptions(config);

    async function activateVerifiedUser(userId: string): Promise<void> {
        await database.query(
            `update munch.users
             set status = 'active',
                 email_verified = true,
                 email_verified_at = coalesce(email_verified_at, now()),
                 updated_at = now()
             where id = $1`,
            [userId],
        );
    }

    return betterAuth({
        appName: "Munch",
        baseURL: config.baseUrl,
        basePath: "/api/auth",
        secret: config.secret,
        database,
        trustedOrigins: [...betterAuthTrustedOrigins(config.baseUrl)],
        emailAndPassword: {
            enabled: true,
            disableSignUp: !passwordSignupEnabled,
            minPasswordLength: 16,
            maxPasswordLength: 128,
            autoSignIn: false,
            requireEmailVerification:
                config.publicPasswordSignup && !reviewerSeedMode,
            revokeSessionsOnPasswordReset: true,
            sendResetPassword: async ({ user, url }) => {
                await sendBetterAuthPasswordReset({
                    email: user.email,
                    resetUrl: url,
                });
            },
        },
        emailVerification: {
            sendOnSignUp: config.publicPasswordSignup && !reviewerSeedMode,
            autoSignInAfterVerification: false,
            sendVerificationEmail: async ({ user, url }) => {
                await sendBetterAuthVerificationEmail({
                    email: user.email,
                    verificationUrl: url,
                });
            },
        },
        user: {
            modelName: "users",
            fields: {
                name: "name",
                email: "email",
                emailVerified: "email_verified",
                image: "image",
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
            changeEmail: {
                enabled: false,
            },
            deleteUser: {
                enabled: false,
            },
        },
        session: {
            modelName: "auth_sessions",
            fields: {
                userId: "user_id",
                token: "token",
                expiresAt: "expires_at",
                ipAddress: "ip_address",
                userAgent: "user_agent",
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
            expiresIn: 60 * 60 * 24 * 30,
            updateAge: 60 * 60 * 24,
        },
        account: {
            modelName: "auth_accounts",
            fields: {
                userId: "user_id",
                accountId: "account_id",
                providerId: "provider_id",
                accessToken: "access_token",
                refreshToken: "refresh_token",
                idToken: "id_token",
                accessTokenExpiresAt: "access_token_expires_at",
                refreshTokenExpiresAt: "refresh_token_expires_at",
                scope: "scope",
                password: "password",
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
            accountLinking: {
                // Google ID tokens with verified email addresses may link to
                // matching Munch accounts. Unverified providers cannot claim
                // existing accounts by email. Enabled whenever a social
                // provider itself is registered (Google web client
                // credentials, or the Apple identifier set IOS-AUTH lands):
                // the web redirect flow signs in through the same provider,
                // so requiring the Android client here would silently split
                // a web Google sign-in from the account it belongs to.
                enabled:
                    Boolean(
                        config.googleWebClientId && config.googleClientSecret,
                    ) || appleSignInConfigured(config),
                // Amendment I guardrail (c): EXPLICIT linking (the Settings
                // linkSocial flow, against an already signed-in account)
                // keys on provider identity, never email matching. Better
                // Auth's default refuses a link whose provider email
                // differs from the account email — which would break
                // exactly the legitimate cases Amendment I names (a Google
                // identity on a different mailbox, an Apple private-relay
                // address). The session-bound link is the ownership proof
                // for both sides, so different emails are allowed HERE.
                // Implicit sign-in linking is a separate path and keeps
                // its verified-email gates (defaults unchanged).
                allowDifferentEmails: true,
            },
        },
        ...((config.googleWebClientId && config.googleClientSecret) ||
        appleOptions
            ? {
                  socialProviders: {
                      ...(config.googleWebClientId && config.googleClientSecret
                          ? {
                                google: {
                                    clientId: googleClientIds,
                                    clientSecret: config.googleClientSecret,
                                },
                            }
                          : {}),
                      ...(appleOptions ? { apple: appleOptions } : {}),
                  },
              }
            : {}),
        verification: {
            modelName: "auth_verifications",
            fields: {
                identifier: "identifier",
                value: "value",
                expiresAt: "expires_at",
                createdAt: "created_at",
                updatedAt: "updated_at",
            },
            storeIdentifier: "hashed",
        },
        databaseHooks: {
            user: {
                create: {
                    before: async (user) => ({
                        data: {
                            ...user,
                            email: user.email.trim().toLowerCase(),
                            name: user.name?.trim() || "Munch user",
                        },
                    }),
                    after: async (user) => {
                        if (user.emailVerified) {
                            await activateVerifiedUser(user.id);
                        }
                    },
                },
                update: {
                    after: async (user) => {
                        if (user.emailVerified) {
                            await activateVerifiedUser(user.id);
                        }
                    },
                },
            },
        },
        rateLimit: {
            enabled: true,
            window: 60,
            max: 100,
            customRules: {
                "/sign-in/magic-link": {
                    window: 60,
                    max: 5,
                },
                "/sign-in/email": {
                    window: 60,
                    max: 5,
                },
                "/sign-in/username": {
                    window: 60,
                    max: 5,
                },
                "/sign-up/email": {
                    window: 60,
                    max: 2,
                },
                "/oauth2/register": {
                    window: 60,
                    max: 20,
                },
                "/oauth2/token": {
                    window: 60,
                    max: 60,
                },
            },
        },
        advanced: {
            cookiePrefix: "munch",
            useSecureCookies: config.production,
            // Railway's edge overwrites X-Real-IP with the client address. Read
            // only that trusted single-value header instead of accepting a
            // client-controlled X-Forwarded-For chain for auth rate limiting.
            ipAddress: {
                ipAddressHeaders: ["x-real-ip"],
            },
            database: {
                generateId: "uuid",
            },
            defaultCookieAttributes: {
                httpOnly: true,
                sameSite: "lax",
                secure: config.production,
                path: "/",
            },
        },
        plugins: [
            bearer(),
            jwt({
                disableSettingJwtHeader: true,
            }),
            magicLink({
                expiresIn: config.magicLinkExpiresIn,
                disableSignUp: false,
                storeToken: "hashed",
                sendMagicLink: async ({ email, url }) => {
                    await sendBetterAuthMagicLink({
                        email,
                        loginUrl: buildScannerSafeMagicLink({
                            generatedUrl: url,
                            baseUrl: config.baseUrl,
                        }),
                        expiresAt: new Date(
                            Date.now() + config.magicLinkExpiresIn * 1000,
                        ),
                    });
                },
            }),
            username({
                schema: {
                    user: {
                        fields: {
                            username: "username",
                            displayUsername: "display_username",
                        },
                    },
                },
                minUsernameLength: 3,
                maxUsernameLength: 40,
            }),
            oauthProvider({
                loginPage: "/connect/sign-in",
                consentPage: "/connect/consent",
                allowDynamicClientRegistration: true,
                allowUnauthenticatedClientRegistration: true,
                allowPublicClientPrelogin: true,
                // Hono serves the external issuer-insertion alias through
                // registerDiscoveryRoutes. Better Auth cannot observe that
                // framework-level route and otherwise logs a false warning on
                // the first OAuth request.
                silenceWarnings: {
                    oauthAuthServerConfig: true,
                },
                validAudiences: [munchMcpResourceUrl(config.baseUrl)],
                scopes: [...MUNCH_OAUTH_SCOPES],
                clientRegistrationDefaultScopes: [
                    ...MUNCH_DEFAULT_OAUTH_SCOPES,
                ],
                accessTokenExpiresIn: 15 * 60,
                refreshTokenExpiresIn: 90 * 24 * 60 * 60,
                codeExpiresIn: 5 * 60,
                storeClientSecret: "hashed",
                prefix: {
                    clientSecret: "munch_secret_",
                    opaqueAccessToken: "munch_access_",
                    refreshToken: "munch_refresh_",
                },
            }),
        ],
    });
}

export type MunchBetterAuth = ReturnType<typeof createMunchBetterAuth>;

let instance: MunchBetterAuth | null = null;

export function getMunchBetterAuth(): MunchBetterAuth {
    instance ??= createMunchBetterAuth();
    return instance;
}

export async function createMobileSignInHandoff(input: {
    sessionToken: string;
    codeChallenge: string;
}): Promise<string> {
    if (!input.sessionToken || input.sessionToken.length > 16_384) {
        throw new Error("A valid Munch session is required for app sign-in");
    }
    if (!validMobileCodeChallenge(input.codeChallenge)) {
        throw new Error("A valid mobile sign-in challenge is required");
    }

    const code = randomBytes(32).toString("base64url");
    const identifier = MOBILE_HANDOFF_IDENTIFIER_PREFIX + sha256Base64Url(code);
    const value = JSON.stringify({
        sessionToken: input.sessionToken,
        challenge: input.codeChallenge,
    });
    const expiresAt = new Date(Date.now() + MOBILE_HANDOFF_TTL_MS);

    await getAuthDatabase().query(
        `insert into munch.auth_verifications (identifier, value, expires_at)
         values ($1, $2, $3)`,
        [identifier, value, expiresAt],
    );
    return code;
}

export async function exchangeMobileSignInHandoff(input: {
    code: string;
    codeVerifier: string;
}): Promise<string | null> {
    if (
        !/^[A-Za-z0-9_-]{43}$/.test(input.code) ||
        !validMobileCodeVerifier(input.codeVerifier)
    ) {
        return null;
    }

    const identifier =
        MOBILE_HANDOFF_IDENTIFIER_PREFIX + sha256Base64Url(input.code);
    const challenge = sha256Base64Url(input.codeVerifier);
    const result = await getAuthDatabase().query<{ value: string }>(
        `delete from munch.auth_verifications
         where identifier = $1
           and expires_at > now()
           and value::jsonb ->> 'challenge' = $2
         returning value`,
        [identifier, challenge],
    );
    const value = result.rows[0]?.value;
    if (!value) return null;

    try {
        const payload = JSON.parse(value) as { sessionToken?: unknown };
        return typeof payload.sessionToken === "string" &&
            payload.sessionToken.length > 0 &&
            payload.sessionToken.length <= 16_384
            ? payload.sessionToken
            : null;
    } catch {
        return null;
    }
}
