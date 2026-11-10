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
      if(!response.ok||!payload.url)throw new Error(payload.message||payload.error||'Google sign-in could not be started.');
      location.href=payload.url;
    }catch(error){
      button.disabled=false;
      button.removeAttribute('aria-busy');
      if(body.errorCallbackURL){location.href=body.errorCallbackURL;return;}
      const target=document.querySelector('[data-social-error]');
      if(target)target.textContent=error.message||'Google sign-in could not be started.';
    }
  });
});
</script>`;
}
