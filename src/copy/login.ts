// Typed content for the OAuth login screen (public/login.html and its
// translated public/{locale}/login.html), rendered by scripts/gen-login.ts.
// Unlike the rest of the site, this page is rendered per in-flight OAuth
// session (see src/oauth.ts's renderLoginPage) rather than served as a flat
// file at a fixed URL — it has no route in src/routes.ts's PAGE_ROUTES and
// no entry in the sitemap, deliberately: it's reachable only via
// GET /authorize with a client's redirect_uri/state/client_id, is linked
// from nowhere crawlable, and has zero SEO surface. Translating it is a
// pure UX call for the human going through the flow, not an SEO one.
//
// LOGIN, LOGIN_ERRORS and LOGIN_CLIENT_NOTICE are full
// `Record<SiteLocale, ...>`s, not the `Partial` src/copy/legal.ts still
// uses: every locale in SITE_LOCALES is translated, so the type can now do
// the enforcing. Adding a locale to src/routes.ts's LOCALES without adding
// its login copy here is a
// `bun run typecheck` failure — which is the whole completeness guarantee,
// since nothing else checks it. src/oauth.ts still decides availability by
// asking whether public/{locale}/login.html exists on disk rather than by
// importing this module, matching how src/index.ts's locale routes work:
// a locale is available when its page is built, not when a data object
// claims it should be. Keep the two in step by re-running
// scripts/gen-login.ts after touching this file.

import type { SiteLocale } from "../routes.js";
import {
    LOGIN_DE,
    LOGIN_CLIENT_NOTICE_DE,
    LOGIN_ERRORS_DE,
} from "./login.de.js";
import {
    LOGIN_ES,
    LOGIN_CLIENT_NOTICE_ES,
    LOGIN_ERRORS_ES,
} from "./login.es.js";
import {
    LOGIN_FR,
    LOGIN_CLIENT_NOTICE_FR,
    LOGIN_ERRORS_FR,
} from "./login.fr.js";
import {
    LOGIN_NL,
    LOGIN_CLIENT_NOTICE_NL,
    LOGIN_ERRORS_NL,
} from "./login.nl.js";
import {
    LOGIN_PL,
    LOGIN_CLIENT_NOTICE_PL,
    LOGIN_ERRORS_PL,
} from "./login.pl.js";
import {
    LOGIN_IT,
    LOGIN_CLIENT_NOTICE_IT,
    LOGIN_ERRORS_IT,
} from "./login.it.js";
import {
    LOGIN_UK,
    LOGIN_CLIENT_NOTICE_UK,
    LOGIN_ERRORS_UK,
} from "./login.uk.js";
import {
    LOGIN_JA,
    LOGIN_CLIENT_NOTICE_JA,
    LOGIN_ERRORS_JA,
} from "./login.ja.js";

export interface LoginDoc {
    title: string;
    subtitle: string;
    googleButton: string;
    dividerText: string;
    emailLabel: string;
    passwordLabel: string;
    /** The email form's two submit buttons: `action=signin` and
     * `action=signup` on POST /approve. Sign-up is explicit — a failed
     * sign-in never creates an account (see src/oauth.ts). */
    signInButton: string;
    createAccountButton: string;
    /** "By continuing you confirm..." — {terms}/{privacy} are replaced with
     * the localized link text for Terms of Service / Privacy Policy by the
     * generator; keep both placeholders in the sentence. */
    consentNote: string;
    termsLinkText: string;
    privacyLinkText: string;
    newHereNote: string;
    afterConnectNote: string;
}

/**
 * Every error the login page shows. The password ones are picked by the
 * stable `code` on src/auth-errors.ts's SignInError / SignUpError, never by
 * Supabase's message text, which is never rendered: it is untranslated
 * third-party wording, and on the sign-in path it would say whether an
 * address has an account.
 *
 * - invalidCredentials: a wrong email or password, on either button.
 * - signInFailed: sign-in could not be attempted (rate limit, outage).
 * - weakPassword / passwordTooLong / emailInvalid / signUpFailed: Create
 *   account refused. passwordTooLong is checked in /approve itself, since
 *   GoTrue reports it as the same validation_failed a malformed email gets.
 */
export interface LoginErrors {
    googleCancelled: string;
    googleFailed: string;
    invalidCredentials: string;
    signInFailed: string;
    weakPassword: string;
    passwordTooLong: string;
    emailInvalid: string;
    signUpFailed: string;
}

/**
 * The consent notice under the login card's subtitle: where the browser is
 * sent once the user signs in, so an OAuth client can't quietly redirect a
 * session somewhere the user didn't start from (the MCP spec requires the
 * consent page to show the redirect URI's host). src/oauth.ts's
 * renderClientNotice() picks one of the three per session: `returnTo` for a
 * known assistant host, `unknownHost` (with a warning tint) for any other
 * https host or a custom scheme, `loopback` (also tinted) for localhost /
 * 127.0.0.1 / [::1]. The client's self-declared `client_name` is never
 * shown — it's attacker-controlled, which is exactly why the host is.
 *
 * All three are plain text, escaped at render time. `{host}` is replaced
 * by the escaped redirect host at request time — keep the placeholder
 * verbatim in every translation (it may appear more than once).
 */
export interface LoginClientNotice {
    returnTo: string;
    unknownHost: string;
    loopback: string;
}

const EN: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Sign in to connect",
    googleButton: "Continue with Google",
    dividerText: "or use email",
    emailLabel: "Email",
    passwordLabel: "Password",
    signInButton: "Sign in",
    createAccountButton: "Create account",
    consentNote:
        "By continuing you confirm you're at least 16, agree to the {terms} and {privacy}, and consent to us storing the meals, weight and alcohol you log, which is health data.",
    termsLinkText: "Terms of Service",
    privacyLinkText: "Privacy Policy",
    newHereNote:
        "New here? Enter your email and a password, then choose Create account.",
    afterConnectNote:
        "After successful connection in your client, save your password somewhere and close this browser tab.",
};

export const LOGIN: Record<SiteLocale, LoginDoc> = {
    en: EN,
    de: LOGIN_DE,
    es: LOGIN_ES,
    fr: LOGIN_FR,
    nl: LOGIN_NL,
    pl: LOGIN_PL,
    it: LOGIN_IT,
    uk: LOGIN_UK,
    ja: LOGIN_JA,
};

export const LOGIN_ERRORS: Record<SiteLocale, LoginErrors> = {
    en: {
        googleCancelled: "Google sign-in was cancelled. Please try again.",
        googleFailed: "Google sign-in failed. Please try again.",
        invalidCredentials: "Wrong email or password.",
        signInFailed:
            "Sign-in isn't working right now. Please try again in a few minutes.",
        weakPassword:
            "That password is too weak. Choose a longer one that mixes letters, numbers and symbols.",
        passwordTooLong:
            "That password is too long. Choose one of 72 characters or fewer.",
        emailInvalid: "That email address isn't valid. Check it for typos.",
        signUpFailed:
            "We couldn't create your account. Please try again later.",
    },
    de: LOGIN_ERRORS_DE,
    es: LOGIN_ERRORS_ES,
    fr: LOGIN_ERRORS_FR,
    nl: LOGIN_ERRORS_NL,
    pl: LOGIN_ERRORS_PL,
    it: LOGIN_ERRORS_IT,
    uk: LOGIN_ERRORS_UK,
    ja: LOGIN_ERRORS_JA,
};

export const LOGIN_CLIENT_NOTICE: Record<SiteLocale, LoginClientNotice> = {
    en: {
        returnTo: "After you sign in, you'll be sent back to {host}.",
        unknownHost:
            "{host} isn't an assistant we recognise. Only continue if you started connecting from {host} yourself.",
        loopback:
            "You'll be sent back to a program running on this computer ({host}). Only continue if you started this connection from it.",
    },
    de: LOGIN_CLIENT_NOTICE_DE,
    es: LOGIN_CLIENT_NOTICE_ES,
    fr: LOGIN_CLIENT_NOTICE_FR,
    nl: LOGIN_CLIENT_NOTICE_NL,
    pl: LOGIN_CLIENT_NOTICE_PL,
    it: LOGIN_CLIENT_NOTICE_IT,
    uk: LOGIN_CLIENT_NOTICE_UK,
    ja: LOGIN_CLIENT_NOTICE_JA,
};
