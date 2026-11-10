import {
    APPLE_APP_BUNDLE_IDENTIFIER,
    generateAppleClientSecret,
} from "./apple-client-secret.js";
import type { BetterAuthRuntimeConfig } from "./config.js";

/**
 * Shared social sign-in initiation for the web surfaces.
 *
 * Verified Better Auth route contract (better-auth 1.6.25, mounted by
 * `src/auth/routes.ts` at `/api/auth/*`):
 *
 * - Sign-in initiation is POST-only. `POST /api/auth/sign-in/social` with a
 *   JSON body `{ provider, callbackURL, errorCallbackURL?, oauth_query? }`
 *   returns `200 { url, redirect: true }`, where `url` is the provider's
 *   consent URL. A GET on the same path is a 404 by design — the endpoint
 *   simply does not exist for GET. The packaged app uses the same POST with
 *   an `idToken` body instead (see `mobile/runtime.js`).
 * - The OAuth-provider plugin's before-hook recognises `oauth_query` on
 *   `/sign-in/social` and carries the signed MCP authorization transaction
 *   through the provider round-trip, exactly as it does for magic links.
 * - Linking a provider to an already signed-in account (Amendment I) is the
 *   same shape against `POST /api/auth/link-social` with session headers:
 *   `{ provider, callbackURL, errorCallbackURL? }` → `{ url, redirect }`.
 *   `buildSocialProviderRequest` serves both modes so the link flow reuses
 *   this initiation code instead of growing a second copy.
 * - The provider callback is `GET /api/auth/callback/<provider>`, derived by
 *   Better Auth from the configured base URL + `/api/auth` base path.
 */

export const GOOGLE_SOCIAL_PROVIDER = "google";

/** POST endpoint that starts a social sign-in (Better Auth basePath + route). */
export const SOCIAL_SIGN_IN_PATH = "/api/auth/sign-in/social";

/** POST endpoint that links a social provider to a signed-in session. */
export const SOCIAL_LINK_PATH = "/api/auth/link-social";

/**
 * Web Google sign-in is configured when the web OAuth client credentials
 * exist. This is also the exact condition under which `src/auth/auth.ts`
 * registers the Better Auth `google` social provider, so a surface that
 * renders the button from this predicate can always initiate the flow.
 */
export function googleWebSignInConfigured(
    config: BetterAuthRuntimeConfig,
): boolean {
    return Boolean(config.googleWebClientId && config.googleClientSecret);
}

/**
 * The packaged Android flow additionally needs the Android OAuth client:
 * Google verifies the app's package + signing certificate against it before
 * Credential Manager returns an ID token.
 */
export function googleAndroidSignInConfigured(
    config: BetterAuthRuntimeConfig,
): boolean {
    return (
        googleWebSignInConfigured(config) &&
        Boolean(config.googleAndroidClientId)
    );
}

export const APPLE_SOCIAL_PROVIDER = "apple";

/**
 * Sign in with Apple is configured when the full Apple identifier set
 * exists (Services ID + key ID + team ID + private key — `src/auth/config.ts`
 * enforces the all-or-nothing rule). This predicate is the exact condition
 * under which the IOS-AUTH slice can register the Better Auth `apple`
 * social provider; until then the account-linking read model honestly
 * reports Apple as not configured instead of offering a link that cannot
 * start.
 */
export function appleSignInConfigured(
    config: BetterAuthRuntimeConfig,
): boolean {
    return Boolean(
        config.appleServicesId &&
        config.appleKeyId &&
        config.appleTeamId &&
        config.applePrivateKey,
    );
}

/**
 * The packaged iOS flow additionally needs the iOS OAuth client: Google
 * verifies the app's bundle ID against it before returning an ID token,
 * and that token's audience is the iOS client ID.
 */
export function googleIosSignInConfigured(
    config: BetterAuthRuntimeConfig,
): boolean {
    return (
        googleWebSignInConfigured(config) && Boolean(config.googleIosClientId)
    );
}

/**
 * Every Google client ID whose ID tokens the server must accept. Better
 * Auth's Google provider verifies an ID token's audience against this
 * exact list (`verifyIdToken` reads `options.clientId`), so listing the
 * web, Android, and iOS clients here is the whole server-side wiring for
 * native Google sign-in on each platform — the web redirect flow uses the
 * first (web) entry as its authorization client.
 */
export function googleProviderClientIds(
    config: BetterAuthRuntimeConfig,
): string[] {
    return [
        config.googleWebClientId,
        config.googleAndroidClientId,
        config.googleIosClientId,
    ].filter((value): value is string => Boolean(value));
}

export interface AppleProviderOptions {
    clientId: string;
    clientSecret: string;
    appBundleIdentifier: string;
    audience: string[];
}

/**
 * The Better Auth Apple provider registration (IOS-AUTH), or null when
 * Apple is not configured — the provider is then ABSENT from the auth
 * instance and every Apple surface keeps its inert `not_configured`
 * behaviour. Configuration alone flips it on; no code change rides with
 * the values when Michael enters them.
 *
 * Audience handling — the two audiences are not interchangeable:
 *
 * - The **web** flow (authorization-code round-trip through Apple) is a
 *   Services ID client: its ID tokens carry `aud` = the Services ID.
 * - The **packaged iOS app** presents ID tokens from the native
 *   ASAuthorization flow whose `aud` is the app's bundle ID
 *   (`business.munch.app`), never the Services ID.
 *
 * Better Auth's Apple provider verifies ID tokens against its `audience`
 * option when one is set (falling back to `appBundleIdentifier`, then
 * `clientId`), so the audience list carries BOTH identifiers and either
 * flow's token verifies. `clientId` stays the Services ID: it is the
 * primary client for the web authorization URL and the `sub` of the
 * generated client-secret JWT. `appBundleIdentifier` is set as well so
 * the intent survives any future audience-option change.
 *
 * The client secret is generated here from the `.p8` key material (see
 * `apple-client-secret.ts`) — an expiring ES256 JWT, never a stored
 * pre-generated secret.
 */
export function appleProviderOptions(
    config: BetterAuthRuntimeConfig,
): AppleProviderOptions | null {
    if (!appleSignInConfigured(config)) return null;
    const servicesId = config.appleServicesId!;
    return {
        clientId: servicesId,
        clientSecret: generateAppleClientSecret({
            servicesId,
            keyId: config.appleKeyId!,
            teamId: config.appleTeamId!,
            privateKey: config.applePrivateKey!,
        }),
        appBundleIdentifier: APPLE_APP_BUNDLE_IDENTIFIER,
        audience: [servicesId, APPLE_APP_BUNDLE_IDENTIFIER],
    };
}

export interface SocialProviderRequest {
    path: string;
    body: {
        provider: string;
        callbackURL: string;
        errorCallbackURL?: string;
        oauth_query?: string;
    };
}

export function buildSocialProviderRequest(input: {
    mode: "sign-in" | "link";
    callbackURL: string;
    errorCallbackURL?: string;
    oauthQuery?: string;
    /** Social provider id; defaults to Google. Provider-generic so the
     * account-linking flow (Amendment I) can initiate an Apple link
     * through the same helper once IOS-AUTH registers that provider. */
    provider?: string;
}): SocialProviderRequest {
    return {
        path: input.mode === "link" ? SOCIAL_LINK_PATH : SOCIAL_SIGN_IN_PATH,
        body: {
            provider: input.provider ?? GOOGLE_SOCIAL_PROVIDER,
            callbackURL: input.callbackURL,
            ...(input.errorCallbackURL
                ? { errorCallbackURL: input.errorCallbackURL }
                : {}),
            // The signed MCP continuation is a sign-in concept; the link
            // endpoint's schema has no oauth_query field.
            ...(input.mode === "sign-in" && input.oauthQuery
                ? { oauth_query: input.oauthQuery }
                : {}),
        },
    };
}

function escapeHtmlAttribute(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Google's official multicolour "G" mark, drawn at the 18px size Google's
 * branding guidelines specify for the sign-in button. This is Google's own
 * logo asset (a trademark mark, not app artwork), reproduced in SVG form.
 */
export const GOOGLE_G_LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>`;

/**
 * The "Continue with Google" control, following Google's branding rules
 * (white button, dark text, the multicolour G, "Continue with Google"
 * wording) expressed in the house `.button` grammar. The button carries its
 * initiation parameters as data attributes; `socialProviderScript()` wires
 * every `[data-social-sign-in]` button on the page. Amendment I's link flow
 * reuses this markup with a request built for mode "link".
 */
export function googleSignInButtonHtml(input: {
    callbackURL: string;
    errorCallbackURL?: string;
    oauthQuery?: string;
}): string {
    const request = buildSocialProviderRequest({
        mode: "sign-in",
        callbackURL: input.callbackURL,
        errorCallbackURL: input.errorCallbackURL,
        oauthQuery: input.oauthQuery,
    });
    return `<button type="button" class="button button-google" data-social-sign-in data-social-path="${escapeHtmlAttribute(request.path)}" data-social-body="${escapeHtmlAttribute(JSON.stringify(request.body))}">${GOOGLE_G_LOGO_SVG}<span>Continue with Google</span></button>`;
}

/**
 * Apple's logo mark for the Sign in with Apple control, drawn in the
 * button's own colour (Apple's branding sets the control itself: black
 * ground, white text and mark, "Continue with Apple" wording).
 */
export const APPLE_LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>`;

/**
 * The "Continue with Apple" control (S6 slice 10). Rendered ONLY when
 * `appleSignInConfigured` holds — the exact condition under which
 * `src/auth/auth.ts` registers the Better Auth `apple` provider — so an
 * unconfigured deployment shows no Apple control at all (honest absence,
 * never a dead button). Initiation reuses the same prepared-request
 * shape and wiring script as Google, with provider `apple`.
 */
export function appleSignInButtonHtml(input: {
    callbackURL: string;
    errorCallbackURL?: string;
    oauthQuery?: string;
}): string {
    const request = buildSocialProviderRequest({
        mode: "sign-in",
        provider: APPLE_SOCIAL_PROVIDER,
        callbackURL: input.callbackURL,
        errorCallbackURL: input.errorCallbackURL,
        oauthQuery: input.oauthQuery,
    });
    return `<button type="button" class="button button-apple" data-social-sign-in data-social-path="${escapeHtmlAttribute(request.path)}" data-social-body="${escapeHtmlAttribute(JSON.stringify(request.body))}">${APPLE_LOGO_SVG}<span>Continue with Apple</span></button>`;
}

/**
 * Inline script that initiates the social flow for every
 * `[data-social-sign-in]` button on the page: POST the prepared request to
 * Better Auth, then follow the returned provider consent URL. Failures go
 * to the request's error callback when one was configured, matching how
 * Better Auth itself reports provider errors.
 */
export function socialProviderScript(): string {
    return `<script>
document.querySelectorAll('[data-social-sign-in]').forEach((button)=>{
  button.addEventListener('click',async()=>{
    const path=button.dataset.socialPath;
    let body={};
    try{body=JSON.parse(button.dataset.socialBody||'{}');}catch{body={};}
    button.disabled=true;
    button.setAttribute('aria-busy','true');
    try{
      const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(body)});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload.url)throw new Error(payload.message||payload.error||'Sign-in could not be started.');
      location.href=payload.url;
    }catch(error){
      button.disabled=false;
      button.removeAttribute('aria-busy');
      if(body.errorCallbackURL){location.href=body.errorCallbackURL;return;}
      const target=document.querySelector('[data-social-error]');
      if(target)target.textContent=error.message||'Sign-in could not be started.';
    }
  });
});
</script>`;
}
