import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import { getMunchBetterAuth } from "./auth.js";
import { getBetterAuthRuntimeConfig } from "./config.js";
import {
    appleSignInConfigured,
    buildSocialProviderRequest,
    googleWebSignInConfigured,
} from "./social-sign-in.js";
import {
    assertProviderIdentityLinkable,
    isSignInProviderId,
    listSignInMethods,
    providerSubjectFromIdToken,
    SignInMethodError,
    SIGN_IN_METHOD_CONFLICT_MESSAGE,
    unlinkSignInMethod,
    type SignInProviderId,
} from "./sign-in-methods.js";

/**
 * Sign-in methods API (Amendment I) — the backend the Settings
 * "Sign-in methods" section (S6 slice 9) renders against:
 *
 * - `GET  /api/app/sign-in-methods` — the read model (masked identities,
 *   per-method state: linked / not_linked / not_configured).
 * - `POST /api/app/sign-in-methods/:provider/link` — starts Better Auth
 *   `linkSocial` against the CURRENT signed-in account. Without an
 *   `idToken` it returns the provider consent URL (`{ url, redirect }`);
 *   with one (the packaged app's native flow) Better Auth verifies the
 *   token and links immediately (`{ url: "", redirect: false, status }`).
 * - `POST /api/app/sign-in-methods/:provider/unlink` — removes the link
 *   under the server-enforced guardrails in `sign-in-methods.ts`.
 *
 * First-party sign-in only: MCP/OAuth consent identities are untouched.
 */

function privateJson(c: Context, body: unknown, status: 200 | 201 = 200) {
    return c.json(body as Record<string, unknown>, status, {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
    });
}

function errorJson(c: Context, error: SignInMethodError) {
    return c.json({ error: error.code, message: error.message }, error.status, {
        "Cache-Control": "no-store, private",
    });
}

function providerConfiguredForLink(
    provider: SignInProviderId,
    config: ReturnType<typeof getBetterAuthRuntimeConfig>,
): boolean {
    return provider === "google"
        ? googleWebSignInConfigured(config)
        : appleSignInConfigured(config);
}

/** Callback targets must stay on this origin: a relative path, or an
 * absolute URL on the configured base origin. Anything else is refused
 * rather than handed to the provider round-trip (open-redirect guard). */
function validCallbackURL(value: unknown, baseUrl: string): value is string {
    if (typeof value !== "string" || value.length === 0) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
        return new URL(value).origin === new URL(baseUrl).origin;
    } catch {
        return false;
    }
}

interface BetterAuthApiErrorShape {
    status?: unknown;
    body?: { code?: unknown; message?: unknown } | null;
}

export function createSignInMethodsRouter(): Hono {
    const router = new Hono();

    router.get("/api/app/sign-in-methods", requireWebSession, async (c) => {
        const config = getBetterAuthRuntimeConfig();
        const methods = await listSignInMethods(c.get("munchUserId"), config);
        return privateJson(c, { methods });
    });

    router.post(
        "/api/app/sign-in-methods/:provider/link",
        requireWebSession,
        requireSameOrigin,
        async (c) => {
            const providerParam = c.req.param("provider")!;
            const config = getBetterAuthRuntimeConfig();

            if (providerParam === "email") {
                return errorJson(
                    c,
                    new SignInMethodError(
                        "sign_in_method_not_removable",
                        400,
                        "Email link sign-in is tied to your account email address — there is no separate link step for it.",
                    ),
                );
            }
            if (!isSignInProviderId(providerParam)) {
                return c.json({ error: "unknown_sign_in_provider" }, 404, {
                    "Cache-Control": "no-store, private",
                });
            }
            const provider: SignInProviderId = providerParam;

            if (!providerConfiguredForLink(provider, config)) {
                return errorJson(
                    c,
                    new SignInMethodError(
                        "provider_not_configured",
                        409,
                        provider === "apple"
                            ? "Apple sign-in isn't set up for Munch yet, so it can't be linked right now."
                            : "Google sign-in isn't set up for Munch right now, so it can't be linked.",
                    ),
                );
            }

            const body = (await c.req.json().catch(() => ({}))) as {
                callbackURL?: unknown;
                errorCallbackURL?: unknown;
                idToken?: unknown;
            };
            const callbackURL = validCallbackURL(
                body.callbackURL,
                config.baseUrl,
            )
                ? (body.callbackURL as string)
                : "/app/settings";
            const errorCallbackURL = validCallbackURL(
                body.errorCallbackURL,
                config.baseUrl,
            )
                ? (body.errorCallbackURL as string)
                : "/app/settings";
            const idToken =
                typeof body.idToken === "string" && body.idToken.length > 0
                    ? body.idToken
                    : undefined;

            // The initiation request shape is the shared social helper's
            // "link" mode (PR #198) — no second initiation implementation.
            const request = buildSocialProviderRequest({
                mode: "link",
                provider,
                callbackURL,
                errorCallbackURL,
            });

            try {
                const result = await getMunchBetterAuth().api.linkSocialAccount(
                    {
                        headers: c.req.raw.headers,
                        body: {
                            provider: request.body.provider,
                            callbackURL: request.body.callbackURL,
                            errorCallbackURL: request.body.errorCallbackURL,
                            ...(idToken ? { idToken: { token: idToken } } : {}),
                        },
                    },
                );
                return privateJson(c, result);
            } catch (error) {
                const shape = error as BetterAuthApiErrorShape;
                const code =
                    typeof shape.body?.code === "string"
                        ? shape.body.code
                        : undefined;

                // Guardrail (b) translation: Better Auth's ID-token link
                // refuses a conflicting identity with a generic
                // LINKING_FAILED after the unique (provider, account)
                // constraint rejects the insert. Name the real reason —
                // and change nothing — when the (already BA-verified)
                // token's subject belongs to a different account.
                if (idToken && code === "LINKING_FAILED") {
                    const subject = providerSubjectFromIdToken(idToken);
                    if (subject) {
                        try {
                            await assertProviderIdentityLinkable({
                                userId: c.get("munchUserId"),
                                providerId: provider,
                                accountId: subject,
                            });
                        } catch (conflict) {
                            if (conflict instanceof SignInMethodError) {
                                return errorJson(c, conflict);
                            }
                            throw conflict;
                        }
                    }
                    return errorJson(
                        c,
                        new SignInMethodError(
                            "sign_in_method_conflict",
                            409,
                            SIGN_IN_METHOD_CONFLICT_MESSAGE,
                        ),
                    );
                }
                if (code === "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED") {
                    // Unreachable once `allowDifferentEmails` is set in
                    // auth.ts (guardrail (c)); kept so a future config
                    // regression surfaces as a named refusal, not a 500.
                    return errorJson(
                        c,
                        new SignInMethodError(
                            "sign_in_method_conflict",
                            409,
                            "That sign-in uses a different email address than this account. Linking is by provider identity, so this should have been allowed — please try again or contact support.",
                        ),
                    );
                }
                const status =
                    typeof shape.status === "number" ? shape.status : 0;
                if (status === 401 || code === "UNAUTHORIZED") {
                    return c.json({ error: "authentication_required" }, 401, {
                        "Cache-Control": "no-store, private",
                    });
                }
                console.error("Sign-in method link failed", {
                    provider,
                    code: code ?? "unknown",
                });
                return c.json({ error: "sign_in_link_failed" }, 502, {
                    "Cache-Control": "no-store, private",
                });
            }
        },
    );

    router.post(
        "/api/app/sign-in-methods/:provider/unlink",
        requireWebSession,
        requireSameOrigin,
        async (c) => {
            const config = getBetterAuthRuntimeConfig();
            try {
                const methods = await unlinkSignInMethod(
                    c.get("munchUserId"),
                    c.req.param("provider")!,
                    config,
                );
                return privateJson(c, { status: true, methods });
            } catch (error) {
                if (error instanceof SignInMethodError) {
                    return errorJson(c, error);
                }
                throw error;
            }
        },
    );

    return router;
}
