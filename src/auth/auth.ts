import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { jwt, magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import { getBetterAuthRuntimeConfig } from "./config.js";
import { sendBetterAuthMagicLink } from "./email.js";
import { buildScannerSafeMagicLink } from "./magic-link-url.js";
import {
    MUNCH_DEFAULT_OAUTH_SCOPES,
    MUNCH_OAUTH_SCOPES,
    munchMcpResourceUrl,
} from "./oauth-scopes.js";

function createMunchBetterAuth() {
    const config = getBetterAuthRuntimeConfig();
    const database = new Pool({
        connectionString: config.databaseUrl,
        max: config.databasePoolSize,
        idleTimeoutMillis: 20_000,
        connectionTimeoutMillis: 10_000,
        application_name: "munch-better-auth",
        options: "-c search_path=munch,public -c role=munch_auth",
    });

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
        trustedOrigins: [config.baseUrl],
        emailAndPassword: {
            enabled: false,
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
                enabled: false,
            },
        },
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
            oauthProvider({
                loginPage: "/connect/sign-in",
                consentPage: "/connect/consent",
                allowDynamicClientRegistration: true,
                allowUnauthenticatedClientRegistration: true,
                allowPublicClientPrelogin: true,
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
